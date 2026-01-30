import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { PostEdge, EdgeType } from '../entities/post-edge.entity';
import { Follow } from '../entities/follow.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { Neo4jService } from '../database/neo4j.service';
import { TopicFollow } from '../entities/topic-follow.entity';
import { PostTopic } from '../entities/post-topic.entity';

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
    @InjectRepository(PostTopic)
    private postTopicRepo: Repository<PostTopic>,
    private dataSource: DataSource,
    private neo4jService: Neo4jService,
  ) {}

  /** Resolve effective language filter: profile languages when lang is "my" or omitted and user is logged in. */
  private async getEffectiveLangFilter(
    userId?: string,
    filter?: { lang?: string },
  ): Promise<string[] | undefined> {
    if (filter?.lang === 'all') return undefined;
    if (filter?.lang && filter.lang !== 'my') return [filter.lang];
    if (!userId) return undefined;
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['languages'],
    });
    const languages = user?.languages?.length ? user.languages : undefined;
    return languages;
  }

  /** Whether the user has recommendations enabled (default true). When false, explore shows non-personalized/trending content. */
  private async recommendationsEnabled(userId: string): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['preferences'],
    });
    const prefs = user?.preferences as Record<string, unknown> | undefined;
    const explore = prefs?.explore as Record<string, unknown> | undefined;
    return explore?.recommendationsEnabled !== false;
  }

  /** Load user's explore preferences (languages, followed topic IDs) for personalization. */
  private async getExplorePrefs(userId: string): Promise<{
    languages: string[];
    followedTopicIds: Set<string>;
  }> {
    const [user, topicFollows] = await Promise.all([
      this.userRepo.findOne({
        where: { id: userId },
        select: ['languages'],
      }),
      this.topicFollowRepo.find({
        where: { userId },
        select: ['topicId'],
      }),
    ]);
    const languages = user?.languages?.length ? user.languages : [];
    const followedTopicIds = new Set(topicFollows.map((f) => f.topicId));
    return { languages, followedTopicIds };
  }

  /** Re-rank posts by user preferences: language match and followed topics. Skipped when user has recommendations disabled. */
  private async applyPostPreferences(
    posts: (Post & { reasons?: string[] })[],
    userId: string,
  ): Promise<(Post & { reasons?: string[] })[]> {
    if (posts.length === 0) return posts;
    if (!(await this.recommendationsEnabled(userId))) return posts;
    const prefs = await this.getExplorePrefs(userId);
    const postIds = posts.map((p) => p.id);
    const postTopics = await this.postTopicRepo.find({
      where: { postId: In(postIds) },
      select: ['postId', 'topicId'],
    });
    const postToTopics = new Map<string, string[]>();
    for (const pt of postTopics) {
      const arr = postToTopics.get(pt.postId) || [];
      arr.push(pt.topicId);
      postToTopics.set(pt.postId, arr);
    }
    const scored = posts.map((p) => {
      const langMatch =
        prefs.languages.length &&
        p.lang != null &&
        prefs.languages.includes(p.lang);
      const topicIds = postToTopics.get(p.id) || [];
      const topicMatch = topicIds.some((tid) =>
        prefs.followedTopicIds.has(tid),
      );
      const score = (langMatch ? 2 : 0) + (topicMatch ? 1 : 0);
      return { post: p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => ({
      ...s.post,
      reasons:
        s.score > 0
          ? [
              ...(prefs.languages.length &&
              s.post.lang != null &&
              prefs.languages.includes(s.post.lang)
                ? ['Your language']
                : []),
              ...(postToTopics
                .get(s.post.id)
                ?.some((tid) => prefs.followedTopicIds.has(tid))
                ? ['Topic you follow']
                : []),
              ...(s.post.reasons || []),
            ].slice(0, 2)
          : s.post.reasons,
    }));
  }

  async getTopics(
    userId?: string,
    filter?: { sort?: string; page?: string; limit?: string },
  ) {
    const sortBy = filter?.sort || 'recommended';
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(filter?.limit || '20', 10) || 20),
    );
    const pageNum = Math.max(1, parseInt(filter?.page || '1', 10) || 1);
    const skip = (pageNum - 1) * limitNum;

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
      .orderBy('topic.created_at', 'DESC')
      .skip(skip)
      .take(limitNum + 1)
      .getRawAndEntities();

    let mapped = entities.map((t) => {
      const r = (raw as TopicRawRow[]).find((x) => x.topic_id === t.id);
      return {
        ...t,
        postCount: r ? parseInt(r.postCount, 10) : 0,
        followerCount: r ? parseInt(r.followerCount, 10) : 0,
      };
    });
    let followedTopicIds = new Set<string>();
    if (userId) {
      const follows = await this.topicFollowRepo.find({
        where: { userId },
        select: ['topicId'],
      });
      followedTopicIds = new Set(follows.map((f) => f.topicId));
    }

    if (sortBy === 'cited') {
      mapped = mapped.sort(
        (a, b) =>
          b.followerCount + b.postCount - (a.followerCount + a.postCount),
      );
    } else if (sortBy === 'newest') {
      mapped = mapped.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (
      sortBy === 'recommended' &&
      userId &&
      followedTopicIds.size > 0 &&
      (await this.recommendationsEnabled(userId))
    ) {
      // Preference-aware: followed topics first, then by engagement (only when recommendations enabled)
      mapped = mapped.sort((a, b) => {
        const aFollowed = followedTopicIds.has(a.id) ? 1 : 0;
        const bFollowed = followedTopicIds.has(b.id) ? 1 : 0;
        if (bFollowed !== aFollowed) return bFollowed - aFollowed;
        return b.followerCount + b.postCount - (a.followerCount + a.postCount);
      });
    }
    const result = mapped.slice(0, limitNum);

    return result.map((t) => ({
      ...t,
      isFollowing: followedTopicIds.has(t.id),
      reasons: followedTopicIds.has(t.id)
        ? ['Followed by you', 'Cited today']
        : ['Topic overlap', 'Cited today'],
    }));
  }

  async getPeople(userId?: string, limit = 20, filter?: { sort?: string }) {
    const sortBy = filter?.sort || 'recommended';
    const order: Record<string, 'ASC' | 'DESC'> =
      sortBy === 'newest'
        ? { createdAt: 'DESC' }
        : sortBy === 'cited'
          ? { followerCount: 'DESC' }
          : { followerCount: 'DESC' };

    const users = await this.userRepo.find({
      take: limit,
      order,
      relations: [],
    });

    return users.map((u) => ({
      ...u,
      reasons:
        sortBy === 'newest'
          ? ['Newest']
          : sortBy === 'cited'
            ? ['Most followed']
            : ['Topic overlap', 'Frequently quoted'],
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
    const langFilter = await this.getEffectiveLangFilter(userId, filter);

    if (filter?.sort === 'newest') {
      const query = this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .orderBy('post.created_at', 'DESC');
      if (langFilter?.length) {
        query.andWhere('post.lang IN (:...langs)', { langs: langFilter });
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
      if (langFilter?.length) {
        query.andWhere('post.lang IN (:...langs)', { langs: langFilter });
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

    if (langFilter?.length) {
      query.andWhere('post.lang IN (:...langs)', { langs: langFilter });
    }

    const posts = await query
      .orderBy(
        `CASE post.id ${topPostIds.map((id, idx) => `WHEN '${id}' THEN ${idx}`).join(' ')} END`,
      )
      .getMany();

    let result: (Post & { reasons?: string[] })[] = posts.map((p) => ({
      ...p,
      reasons: ['Cited today', 'High quote velocity'],
    }));
    if (userId) {
      result = await this.applyPostPreferences(result, userId);
    }
    return result;
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
    const langFilter = await this.getEffectiveLangFilter(userId, filter);

    // Simple sort overrides
    if (filter?.sort === 'newest') {
      const query = this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .orderBy('post.created_at', 'DESC')
        .take(limit);
      if (langFilter?.length) {
        query.andWhere('post.lang IN (:...langs)', { langs: langFilter });
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
      if (langFilter?.length) {
        query.andWhere('post.lang IN (:...langs)', { langs: langFilter });
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
    const langFilterDeep = await this.getEffectiveLangFilter(userId, filter);

    const query = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id IN (:...ids)', { ids: postIds })
      .andWhere('post.deleted_at IS NULL');

    if (langFilterDeep?.length) {
      query.andWhere('post.lang IN (:...langs)', { langs: langFilterDeep });
    }

    const posts = await query.getMany();

    // Sort by original count order
    const sortedPosts = postIds
      .map((id) => posts.find((p) => p.id === id))
      .filter((p) => p !== undefined);

    let result: (Post & { reasons?: string[] })[] = sortedPosts.map((p) => ({
      ...p,
      reasons: ['Many backlinks', 'Link chain'],
    }));
    if (userId) {
      result = await this.applyPostPreferences(result, userId);
    }
    return result;
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

      const langFilterNews = await this.getEffectiveLangFilter(userId, filter);
      if (langFilterNews?.length) {
        query.andWhere('post.lang IN (:...langs)', { langs: langFilterNews });
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
    const langFilterNewsroom = await this.getEffectiveLangFilter(
      userId,
      filter,
    );

    const query = this.postRepo
      .createQueryBuilder('post')
      .innerJoin('external_sources', 'source', 'source.post_id = post.id')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.deleted_at IS NULL');

    if (langFilterNewsroom?.length) {
      query.andWhere('post.lang IN (:...langs)', { langs: langFilterNewsroom });
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

    if (langFilterNewsroom?.length) {
      idQuery.andWhere('post.lang IN (:...langs)', {
        langs: langFilterNewsroom,
      });
    }

    const ids = await idQuery
      .select('DISTINCT post.id', 'id')
      .addOrderBy(orderBy, 'DESC')
      .limit(limit)
      .getRawMany();

    if (ids.length === 0) return [];

    const finalPosts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id IN (:...ids)', {
        ids: ids.map((i: { id: string }) => i.id),
      })
      .orderBy(orderBy, 'DESC') // Re-apply order
      .getMany();

    let result: (Post & { reasons?: string[] })[] = finalPosts.map((p) => ({
      ...p,
      reasons: ['Recent sources', 'External links'],
    }));
    if (userId) {
      result = await this.applyPostPreferences(result, userId);
    }
    return result;
  }
}
