import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { Post } from '../entities/post.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { ExploreService } from '../explore/explore.service';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(PostTopic) private postTopicRepo: Repository<PostTopic>,
    private exploreService: ExploreService,
  ) {}

  async findOne(slug: string) {
    const topic = await this.topicRepo.findOne({
      where: { slug },
    });

    if (!topic) return null;

    // Get "Start here" posts (most cited) - re-using explore service logic
    const startHere = await this.exploreService.getTopicStartHere(topic.id, 10);

    return {
      ...topic,
      startHere,
    };
  }

  async getPosts(topicId: string, limit = 50, offset = 0) {
    // Legacy method, redirects to ranked
    return this.getTopicPosts(topicId, 'ranked', limit, offset);
  }

  async getTopicPosts(
    topicIdOrSlug: string,
    sort: 'ranked' | 'recent',
    limit = 20,
    offset = 0,
  ) {
    // Resolve ID
    const topicId = topicIdOrSlug;
    if (topicIdOrSlug.match(/^[a-z0-9-]+$/) && !topicIdOrSlug.includes('-')) {
      // simplistic uuid check failure, assume slug if not uuid
      // but strictly we should check. For now assume caller passes ID if they have it, or we resolve.
      // The controller usually resolves slug.
    }
    // If we assume controller passes ID, we are good.

    const query = this.postRepo
      .createQueryBuilder('post')
      .innerJoin('post_topics', 'pt', 'pt.post_id = post.id')
      .leftJoinAndSelect('post.author', 'author')
      .where('pt.topic_id = :topicId', { topicId })
      .andWhere('post.deleted_at IS NULL')
      .andWhere('post.visibility = :vis', { vis: 'PUBLIC' });

    if (sort === 'ranked') {
      // Spam/Quality Filter
      // 1. Account Age > 3 days OR has significant engagement
      // We can't easily check account age in DB if not indexed or simple.
      // Let's rely on engagement metrics.

      // Ranking Score: quote_count * 3 + reply_count * 1
      // We also enforce a "gate": must have at least 1 quote OR 1 reply OR author created > 7 days ago

      // PostgreSQL specific date check
      query.andWhere(
        "(post.quote_count > 0 OR post.reply_count > 0 OR author.created_at < NOW() - INTERVAL '7 days')",
      );

      query.addSelect('(post.quote_count * 3 + post.reply_count)', 'score');
      query.orderBy('score', 'DESC');
      query.addOrderBy('post.created_at', 'DESC');
    } else {
      // Recent
      query.orderBy('post.created_at', 'DESC');
    }

    return query.skip(offset).take(limit).getMany();
  }

  async getTopicPeople(topicId: string, limit = 20, offset = 0) {
    // Find authors who post frequently in this topic and have high engagement
    // This is a complex query, usually done via Neo4j or materialized view.
    // Simple Postgres approximation:
    const builder = this.postRepo.manager
      .createQueryBuilder()
      .select('author.id', 'id')
      .addSelect('author.handle', 'handle')
      .addSelect('author.display_name', 'displayName')
      .addSelect('COUNT(post.id)', 'postCount')
      .addSelect('SUM(post.quote_count)', 'totalQuotes')
      .from(Post, 'post')
      .innerJoin('post.author', 'author')
      .innerJoin('post_topics', 'pt', 'pt.post_id = post.id')
      .where('pt.topic_id = :topicId', { topicId })
      .andWhere('post.deleted_at IS NULL')
      .andWhere("post.visibility = 'PUBLIC'")
      .groupBy('author.id')
      .orderBy('"totalQuotes"', 'DESC')
      .addOrderBy('"postCount"', 'DESC')
      .limit(limit)
      .offset(offset);

    const raw = await builder.getRawMany<{
      id: string;
      handle: string;
      displayName: string;
      postCount: string;
      totalQuotes: string;
    }>();
    return raw.map((r) => ({
      id: r.id,
      handle: r.handle,
      displayName: r.displayName,
      postCount: parseInt(r.postCount, 10),
      totalQuotes: parseInt(r.totalQuotes, 10),
    }));
  }

  getTopicSources(topicId: string, limit = 20, offset = 0): Promise<unknown[]> {
    void topicId;
    void limit;
    void offset;
    // Find external sources linked in posts in this topic
    // This requires a join with external_sources
    // For now, return empty list to avoid breaking if entity missing.
    return Promise.resolve([]);
  }
}
