import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { PostEdge, EdgeType } from '../entities/post-edge.entity';
import { Follow } from '../entities/follow.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { Neo4jService } from '../database/neo4j.service';

@Injectable()
export class ExploreService {
  constructor(
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(PostEdge) private postEdgeRepo: Repository<PostEdge>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(ExternalSource) private externalSourceRepo: Repository<ExternalSource>,
    private dataSource: DataSource,
    private neo4jService: Neo4jService,
  ) {}

  async getTopics(filter?: { lang?: string; sort?: string }) {
    // In a real implementation, filter by lang using Neo4j or complex queries
    const topics = await this.topicRepo.find({ 
      take: 20, 
      order: { createdAt: 'DESC' },
    });

    return topics.map(t => ({
      ...t,
      reasons: ['Topic overlap', 'Cited today'],
    }));
  }

  async getPeople(userId?: string, filter?: { lang?: string; sort?: string }) {
    // If user is logged in, use AI-powered recommendations
    if (userId) {
      // This will be handled by RecommendationService.getRecommendedPeople
      // Fallback to basic for now
    }
    
    // Basic: return users ordered by follower count
    const users = await this.userRepo.find({ 
      take: 20, 
      order: { followerCount: 'DESC' },
    });

    return users.map(u => ({
      ...u,
      reasons: ['Topic overlap', 'Frequently quoted'],
    }));
  }

  /**
   * Get "Quoted Now" posts - posts with high quote velocity
   * Score = quotes_last_6h * 1.0 + quotes_last_24h * 0.3
   */
  async getQuotedNow(userId?: string, limit = 20, filter?: { lang?: string; sort?: string }) {
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get quote edges from last 24 hours
    const recentQuotes = await this.postEdgeRepo
      .createQueryBuilder('edge')
      .where('edge.edge_type = :type', { type: EdgeType.QUOTE })
      .andWhere('edge.created_at >= :since', { since: twentyFourHoursAgo })
      .getMany();

    // Count quotes per post
    const quoteCounts: Record<string, { last6h: number; last24h: number }> = {};
    
    for (const quote of recentQuotes) {
      const postId = quote.toPostId;
      if (!quoteCounts[postId]) {
        quoteCounts[postId] = { last6h: 0, last24h: 0 };
      }
      quoteCounts[postId].last24h++;
      if (new Date(quote.createdAt) >= sixHoursAgo) {
        quoteCounts[postId].last6h++;
      }
    }

    // Calculate scores
    const scoredPosts = Object.entries(quoteCounts).map(([postId, counts]) => ({
      postId,
      score: counts.last6h * 1.0 + counts.last24h * 0.3,
    }));

    // Sort by score and get top posts
    scoredPosts.sort((a, b) => b.score - a.score);
    const topPostIds = scoredPosts.slice(0, limit).map(p => p.postId);

    if (topPostIds.length === 0) {
      return [];
    }

    // Fetch full post data
    const query = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id IN (:...ids)', { ids: topPostIds })
      .andWhere('post.deleted_at IS NULL');
      
    if (filter?.lang && filter.lang !== 'all') {
      query.andWhere('post.lang = :lang', { lang: filter.lang });
    }

    const posts = await query
      .orderBy(`CASE post.id ${topPostIds.map((id, idx) => `WHEN '${id}' THEN ${idx}`).join(' ')} END`)
      .getMany();

    return posts.map(p => ({
      ...p,
      reasons: ['Cited today', 'High quote velocity'],
    }));
  }

  /**
   * Get topic "Start here" posts - most cited posts in topic
   * Score = quote_count * 1.0 + backlinks * 0.2 + replies * 0.1
   */
  async getTopicStartHere(topicId: string, limit = 10) {
    // Get posts in topic
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoin('post_topics', 'pt', 'pt.post_id = post.id')
      .where('pt.topic_id = :topicId', { topicId })
      .andWhere('post.deleted_at IS NULL')
      .leftJoinAndSelect('post.author', 'author')
      .getMany();

    // Get backlink counts from Neo4j or Postgres
    const postIds = posts.map(p => p.id);
    const backlinks = await this.postEdgeRepo
      .createQueryBuilder('edge')
      .select('edge.to_post_id', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('edge.to_post_id IN (:...ids)', { ids: postIds })
      .andWhere('edge.edge_type = :type', { type: EdgeType.LINK })
      .groupBy('edge.to_post_id')
      .getRawMany();

    const backlinkMap = new Map(
      backlinks.map(b => [b.postId, parseInt(b.count)])
    );

    // Calculate scores
    const scored = posts.map(post => ({
      post,
      score: 
        (post.quoteCount || 0) * 1.0 +
        (backlinkMap.get(post.id) || 0) * 0.2 +
        (post.replyCount || 0) * 0.1,
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => s.post);
  }

  /**
   * Deep Dives - posts that form long chains of links
   * Find posts with many backlinks that lead to other posts with many backlinks
   */
  async getDeepDives(userId?: string, limit = 20, filter?: { lang?: string; sort?: string }) {
    // Get posts with high backlink counts
    const backlinks = await this.postEdgeRepo
      .createQueryBuilder('edge')
      .select('edge.to_post_id', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('edge.edge_type = :type', { type: EdgeType.LINK })
      .groupBy('edge.to_post_id')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit * 2)
      .getRawMany();

    const postIds = backlinks.map(b => b.postId);

    if (postIds.length === 0) {
      return [];
    }

    // Fetch posts with their authors
    const query = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id IN (:...ids)', { ids: postIds })
      .andWhere('post.deleted_at IS NULL');

    if (filter?.lang && filter.lang !== 'all') {
      query.andWhere('post.lang = :lang', { lang: filter.lang });
    }

    const posts = await query
      .getMany();
    
    // Sort by original order and limit
    const sortedPosts = postIds
      .map(id => posts.find(p => p.id === id))
      .filter(p => p !== undefined)
      .slice(0, limit);

    return posts.map(p => ({
      ...p,
      reasons: ['Many backlinks', 'Link chain'],
    }));
  }

  /**
   * Newsroom - recent posts with sources (external links)
   */
  async getNewsroom(userId?: string, limit = 20, filter?: { lang?: string; sort?: string }) {
    // Get posts with external sources from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get post IDs with sources
    const postsWithSources = await this.externalSourceRepo
      .createQueryBuilder('source')
      .select('DISTINCT source.post_id', 'postId')
      .leftJoin('posts', 'post', 'post.id = source.post_id')
      .where('post.created_at >= :since', { since: sevenDaysAgo })
      .andWhere('post.deleted_at IS NULL')
      .getRawMany();

    const postIds = postsWithSources.map(p => p.postId);

    if (postIds.length === 0) {
      return [];
    }

    const query = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id IN (:...ids)', { ids: postIds });

    if (filter?.lang && filter.lang !== 'all') {
      query.andWhere('post.lang = :lang', { lang: filter.lang });
    }

    const posts = await query
      .orderBy('post.created_at', 'DESC')
      .limit(limit)
      .getMany();

    return posts.map(p => ({
      ...p,
      reasons: ['Recent sources', 'External links'],
    }));
  }
}
