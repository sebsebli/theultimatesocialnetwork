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
import { TopicFollow } from '../entities/topic-follow.entity';

interface TopicRawRow {
  topic_id: string;
  postCount: string;
  followerCount: string;
}

@Injectable()
export class ExploreService {
  constructor(
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(PostEdge) private postEdgeRepo: Repository<PostEdge>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(ExternalSource)
    private externalSourceRepo: Repository<ExternalSource>,
    @InjectRepository(TopicFollow)
    private topicFollowRepo: Repository<TopicFollow>,
    private dataSource: DataSource,
    private neo4jService: Neo4jService,
  ) {}

  async getTopics(userId?: string) {
    const { entities, raw } = await this.topicRepo
      .createQueryBuilder('topic')
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)', 'cnt')
            .from('post_topics', 'pt')
            .where('pt.topic_id = topic.id'),
        'postCount',
      )
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)', 'cnt')
            .from('topic_follows', 'tf')
            .where('tf.topic_id = topic.id'),
        'followerCount',
      )
      .orderBy('topic.created_at', 'DESC') // Or sort by counts for "Trending"
      .take(20)
      .getRawAndEntities();

    let followedTopicIds = new Set<string>();
    if (userId) {
      const follows = await this.topicFollowRepo.find({
        where: { userId },
        select: ['topicId'],
      });
      followedTopicIds = new Set(follows.map((f) => f.topicId));
    }

    return entities.map((t) => {
      const r = (raw as TopicRawRow[]).find((x) => x.topic_id === t.id);
      return {
        ...t,
        postCount: r ? parseInt(r.postCount, 10) : 0,
        followerCount: r ? parseInt(r.followerCount, 10) : 0,
        isFollowing: followedTopicIds.has(t.id),
        reasons: ['Topic overlap', 'Cited today'],
      };
    });
  }

  async getPeople(userId?: string) {
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

    return users.map((u) => ({
      ...u,
      reasons: ['Topic overlap', 'Frequently quoted'],
    }));
  }

  /**
   * Get "Quoted Now" posts - posts with high quote velocity
   * Score = quotes_last_6h * 1.0 + quotes_last_24h * 0.3
   */
  async getQuotedNow(
    userId?: string,
    limit = 20,
    filter?: { lang?: string; sort?: string },
  ) {
    // If specific sort requested, bypass algo
    if (filter?.sort === 'newest') {
      const query = this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .orderBy('post.created_at', 'DESC');
      if (filter?.lang && filter.lang !== 'all') {
        query.andWhere('post.lang = :lang', { lang: filter.lang });
      }
      const posts = await query.take(limit).getMany();
      return posts.map((p) => ({ ...p, reasons: ['Newest'] }));
    }

    if (filter?.sort === 'cited') {
      const query = this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .orderBy('post.quote_count', 'DESC');
      if (filter?.lang && filter.lang !== 'all') {
        query.andWhere('post.lang = :lang', { lang: filter.lang });
      }
      const posts = await query.take(limit).getMany();
      return posts.map((p) => ({ ...p, reasons: ['Most cited'] }));
    }

    // Recommended (Default Algo)
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calculate scores in DB using CASE statements
    const scoredIds = await this.postEdgeRepo
      .createQueryBuilder('edge')
      .select('edge.to_post_id', 'postId')
      .addSelect(
        `
        SUM(
          CASE 
            WHEN edge.created_at >= :sixHoursAgo THEN 1.0 
            ELSE 0.3 
          END
        )`,
        'score',
      )
      .where('edge.edge_type = :type', { type: EdgeType.QUOTE })
      .andWhere('edge.created_at >= :twentyFourHoursAgo', {
        twentyFourHoursAgo,
      })
      .setParameters({ sixHoursAgo, twentyFourHoursAgo })
      .groupBy('edge.to_post_id')
      .orderBy('score', 'DESC')
      .limit(limit)
      .getRawMany<{ postId: string; score: number }>();

    if (scoredIds.length === 0) {
      return [];
    }

    const topPostIds = scoredIds.map((s) => s.postId);

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
      .orderBy(
        `CASE post.id ${topPostIds.map((id, idx) => `WHEN '${id}' THEN ${idx}`).join(' ')} END`,
      )
      .getMany();

    return posts.map((p) => ({
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
    const postIds = posts.map((p) => p.id);
    const backlinks = await this.postEdgeRepo
      .createQueryBuilder('edge')
      .select('edge.to_post_id', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('edge.to_post_id IN (:...ids)', { ids: postIds })
      .andWhere('edge.edge_type = :type', { type: EdgeType.LINK })
      .groupBy('edge.to_post_id')
      .getRawMany<{ postId: string; count: string }>();

    const backlinkMap = new Map(
      backlinks.map((b) => [b.postId, parseInt(b.count)]),
    );

    // Calculate scores
    const scored = posts.map((post) => ({
      post,
      score:
        (post.quoteCount || 0) * 1.0 +
        (backlinkMap.get(post.id) || 0) * 0.2 +
        (post.replyCount || 0) * 0.1,
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.post);
  }

  /**
   * Deep Dives - posts that form long chains of links
   * Find posts with many backlinks that lead to other posts with many backlinks
   */
  async getDeepDives(
    userId?: string,
    limit = 20,
    filter?: { lang?: string; sort?: string },
  ) {
    // Simple sort overrides
    if (filter?.sort === 'newest') {
      const query = this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .orderBy('post.created_at', 'DESC')
        .take(limit);
      if (filter?.lang && filter.lang !== 'all') {
        query.andWhere('post.lang = :lang', { lang: filter.lang });
      }
      return (await query.getMany()).map((p) => ({
        ...p,
        reasons: ['Newest'],
      }));
    }

    if (filter?.sort === 'cited') {
      const query = this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .orderBy('post.quote_count', 'DESC')
        .take(limit);
      if (filter?.lang && filter.lang !== 'all') {
        query.andWhere('post.lang = :lang', { lang: filter.lang });
      }
      return (await query.getMany()).map((p) => ({
        ...p,
        reasons: ['Most cited'],
      }));
    }

    // Default Algo: Get top posts by backlink count directly from DB
    const rankedIds = await this.postEdgeRepo
      .createQueryBuilder('edge')
      .select('edge.to_post_id', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('edge.edge_type = :type', { type: EdgeType.LINK })
      .groupBy('edge.to_post_id')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<{ postId: string; count: string }>();

    if (rankedIds.length === 0) {
      return [];
    }

    const postIds = rankedIds.map((r) => r.postId);

    // Fetch full post data for these IDs
    const query = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id IN (:...ids)', { ids: postIds })
      .andWhere('post.deleted_at IS NULL');

    if (filter?.lang && filter.lang !== 'all') {
      query.andWhere('post.lang = :lang', { lang: filter.lang });
    }

    const posts = await query.getMany();

    // Sort by original count order
    const sortedPosts = postIds
      .map((id) => posts.find((p) => p.id === id))
      .filter((p) => p !== undefined);

    return sortedPosts.map((p) => ({
      ...p,
      reasons: ['Many backlinks', 'Link chain'],
    }));
  }

  /**
   * Newsroom - recent posts with sources (external links)
   */
  async getNewsroom(
    userId?: string,
    limit = 20,
    filter?: { lang?: string; sort?: string },
  ) {
    // Overrides
    if (filter?.sort === 'cited') {
      // Cited posts that have external sources?
      // For simplicity, just return most cited posts generally if sort=cited is global
      // Or stick to "Newsroom" theme: posts with sources, ordered by quote count
      // Let's do posts with sources, ordered by quote count.

      const query = this.postRepo
        .createQueryBuilder('post')
        .innerJoin('external_sources', 'source', 'source.post_id = post.id')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .orderBy('post.quote_count', 'DESC')
        .take(limit);

      if (filter?.lang && filter.lang !== 'all') {
        query.andWhere('post.lang = :lang', { lang: filter.lang });
      }
      // distinct posts
      query
        .select('DISTINCT post.id')
        .addSelect('post.*')
        .addSelect('author.*');
      // Note: DISTINCT on post.id might require matching Selects in TypeORM or raw query.
      // Simpler: Just rely on TypeORM's relations, but we need to ensure unique posts.
      // .getMany() usually handles hydration uniqueness but multiple sources per post might cause dupes in raw result before hydration.
      // We can use subquery or stick to logic below.
    }

    // Sort logic (default is Newest for Newsroom usually, but here Recommended is default)
    // If sort is Newest or Recommended, we use the date-based logic.
    // If sort is Cited, we use quote count.

    const orderBy =
      filter?.sort === 'cited' ? 'post.quote_count' : 'post.created_at';

    // Get posts with external sources
    const query = this.postRepo
      .createQueryBuilder('post')
      .innerJoin('external_sources', 'source', 'source.post_id = post.id')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.deleted_at IS NULL');

    if (filter?.lang && filter.lang !== 'all') {
      query.andWhere('post.lang = :lang', { lang: filter.lang });
    }

    // We want distinct posts.
    // TypeORM `getMany` with `innerJoin` might return duplicates if multiple sources.
    // We can use query builder to select distinct ids first.

    // Optimized approach:
    // 1. Find IDs
    // 2. Fetch Entities

    const idQuery = this.postRepo
      .createQueryBuilder('post')
      .innerJoin('external_sources', 'source', 'source.post_id = post.id')
      .where('post.deleted_at IS NULL');

    if (filter?.lang && filter.lang !== 'all') {
      idQuery.andWhere('post.lang = :lang', { lang: filter.lang });
    }

    const ids = (await idQuery
      .select('DISTINCT post.id', 'id')
      .addOrderBy(orderBy, 'DESC')
      .limit(limit)
      .getRawMany()) as { id: string }[];

    if (ids.length === 0) return [];

    const finalPosts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id IN (:...ids)', {
        ids: ids.map((i: { id: string }) => i.id),
      })
      .orderBy(orderBy, 'DESC') // Re-apply order
      .getMany();

    return finalPosts.map((p) => ({
      ...p,
      reasons: ['Recent sources', 'External links'],
    }));
  }
}
