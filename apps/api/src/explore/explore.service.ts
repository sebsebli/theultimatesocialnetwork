import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Not, Like } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { isPendingUser } from '../shared/is-pending-user';
import { PostEdge, EdgeType } from '../entities/post-edge.entity';
import { Follow } from '../entities/follow.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { Neo4jService } from '../database/neo4j.service';
import { TopicFollow } from '../entities/topic-follow.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { UploadService } from '../upload/upload.service';
import Redis from 'ioredis';

interface TopicRawRow {
  topic_id: string;
  postCount: string;
  followerCount: string;
}

@Injectable()
export class ExploreService {
  private readonly logger = new Logger(ExploreService.name);

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
    @Inject('REDIS_CLIENT') private redis: Redis,
    private uploadService: UploadService,
  ) {}

  /** Helper for caching simple paginated results (1-5 min TTL). */
  private async cached<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch (e) {
      this.logger.warn(`Cache read failed for ${key}`, e);
    }
    const result = await fetcher();
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(result));
    } catch (e) {
      this.logger.warn(`Cache write failed for ${key}`, e);
    }
    return result;
  }

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

  /**
   * Filter posts to only those visible to the viewer.
   * - PUBLIC posts: visible only if author is not protected, or viewer is author or follows author.
   * - FOLLOWERS posts: visible only if viewer is the author or follows the author.
   * - When viewerId is absent: only PUBLIC posts from non-protected accounts.
   */
  async filterPostsVisibleToViewer(
    posts: Post[],
    viewerId?: string,
  ): Promise<Post[]> {
    if (posts.length === 0) return posts;
    const authorIds = [
      ...new Set(posts.map((p) => p.authorId).filter(Boolean)),
    ] as string[];
    // Read is_protected from DB (raw SQL) so we never treat public as private; only explicit true = protected. Matches posts.service findOne.
    const authorProtected = new Map<string, boolean>();
    if (authorIds.length > 0) {
      const placeholders = authorIds.map((_, i) => `$${i + 1}`).join(',');
      const rows = await this.dataSource.query<
        { id: string; is_protected: boolean | string }[]
      >(
        `SELECT id, is_protected FROM users WHERE id IN (${placeholders})`,
        authorIds,
      );
      for (const row of rows ?? []) {
        const prot = row.is_protected === true || row.is_protected === 't';
        authorProtected.set(row.id, prot);
      }
    }
    const isAuthorProtected = (authorId: string | null) =>
      authorId ? authorProtected.get(authorId) === true : false;

    // Visibility is from the author's profile only: public profile → all posts visible; protected profile → only followers (and self)
    if (!viewerId) {
      return posts.filter((p) => !isAuthorProtected(p.authorId));
    }

    const protectedAuthorIds = authorIds.filter(
      (id) => id !== viewerId && isAuthorProtected(id),
    );
    let followingSet = new Set<string>();
    if (protectedAuthorIds.length > 0) {
      const follows = await this.followRepo.find({
        where: { followerId: viewerId, followeeId: In(protectedAuthorIds) },
        select: ['followeeId'],
      });
      followingSet = new Set(follows.map((f) => f.followeeId));
    }
    return posts.filter((p) => {
      if (p.authorId === viewerId) return true;
      if (isAuthorProtected(p.authorId))
        return p.authorId && followingSet.has(p.authorId);
      return true;
    });
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

    const cacheKey = `explore:topics:generic:${skip}:${limitNum}`;
    let mapped = await this.cached(cacheKey, 300, async () => {
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

      return entities.map((t) => {
        const r = (raw as TopicRawRow[]).find((x) => x.topic_id === t.id);
        return {
          ...t,
          postCount: r ? parseInt(r.postCount, 10) : 0,
          followerCount: r ? parseInt(r.followerCount, 10) : 0,
        };
      });
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
    const topicIds = result.map((t) => t.id);

    // Most recent post per topic (by created_at DESC) for topic card previews — same behaviour everywhere so cards always show the latest article
    type LatestRow = { topicId: string; postId: string };
    const latestRows: LatestRow[] =
      topicIds.length > 0
        ? await this.dataSource
            .createQueryBuilder()
            .select('pt.topic_id', 'topicId')
            .addSelect('p.id', 'postId')
            .from(PostTopic, 'pt')
            .innerJoin(Post, 'p', 'p.id = pt.post_id AND p.deleted_at IS NULL')
            .where('pt.topic_id IN (:...topicIds)', { topicIds })
            .orderBy('pt.topic_id')
            .addOrderBy('p.created_at', 'DESC')
            .distinctOn(['pt.topic_id'])
            .getRawMany<LatestRow>()
            .catch(() => [])
        : [];

    const postIds = [...new Set(latestRows.map((r) => r.postId))];
    const topicToPostId = new Map(latestRows.map((r) => [r.topicId, r.postId]));

    const posts =
      postIds.length > 0
        ? await this.postRepo.find({
            where: { id: In(postIds) },
            relations: ['author'],
            select: [
              'id',
              'authorId',
              'title',
              'body',
              'headerImageKey',
              'createdAt',
            ],
          })
        : [];
    const visiblePosts = await this.filterPostsVisibleToViewer(posts, userId);
    const visiblePostIds = new Set(visiblePosts.map((p) => p.id));
    const postMap = new Map(posts.map((p) => [p.id, p]));

    function bodyExcerpt(body: string, maxLen = 120): string {
      if (!body || typeof body !== 'string') return '';
      const stripped = body
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/\n+/g, ' ')
        .trim();
      return stripped.length <= maxLen
        ? stripped
        : stripped.slice(0, maxLen) + '…';
    }

    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);

    return result.map((t) => {
      const postId = topicToPostId.get(t.id);
      const post =
        postId && visiblePostIds.has(postId) ? postMap.get(postId) : undefined;
      const headerImageKey = post?.headerImageKey ?? null;
      const recentPost = post
        ? {
            id: post.id,
            title: post.title ?? null,
            bodyExcerpt: bodyExcerpt(post.body),
            headerImageKey,
            headerImageUrl:
              headerImageKey != null && headerImageKey !== ''
                ? getImageUrl(headerImageKey)
                : null,
            author: post.author
              ? {
                  handle: post.author.handle,
                  displayName: post.author.displayName ?? post.author.handle,
                }
              : null,
            createdAt: post.createdAt?.toISOString?.() ?? null,
          }
        : null;
      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        createdAt: t.createdAt?.toISOString?.() ?? null,
        createdBy: t.createdBy ?? null,
        postCount: (t as { postCount?: number }).postCount ?? 0,
        followerCount: (t as { followerCount?: number }).followerCount ?? 0,
        recentPostImageKey: recentPost?.headerImageKey ?? null,
        recentPostImageUrl:
          recentPost?.headerImageKey != null && recentPost.headerImageKey !== ''
            ? getImageUrl(recentPost.headerImageKey)
            : null,
        recentPost,
        isFollowing: followedTopicIds.has(t.id),
        reasons: followedTopicIds.has(t.id)
          ? ['Followed by you', 'Cited today']
          : ['Topic overlap', 'Cited today'],
      };
    });
  }

  async getPeople(
    userId?: string,
    filter?: { sort?: string; page?: number; limit?: number },
  ): Promise<{ items: User[]; hasMore: boolean }> {
    const sortBy = filter?.sort || 'recommended';
    const limitNum = Math.min(50, Math.max(1, filter?.limit ?? 20));
    const pageNum = Math.max(1, filter?.page ?? 1);
    const skip = (pageNum - 1) * limitNum;
    const order: Record<string, 'ASC' | 'DESC'> =
      sortBy === 'newest'
        ? { createdAt: 'DESC' }
        : sortBy === 'cited'
          ? { followerCount: 'DESC' }
          : { followerCount: 'DESC' };

    const users = await this.userRepo.find({
      where: { handle: Not(Like('__pending_%')) },
      skip,
      take: limitNum + 1,
      order,
      relations: [],
      select: [
        'id',
        'handle',
        'displayName',
        'avatarKey',
        'isProtected',
        'createdAt',
        'followerCount',
        'followingCount',
      ],
    });

    let filtered: User[];
    if (userId) {
      const protectedUserIds = users
        .filter((u) => u.isProtected && u.id !== userId)
        .map((u) => u.id);
      let followingSet = new Set<string>();
      if (protectedUserIds.length > 0) {
        const followees = await this.followRepo.find({
          where: { followerId: userId, followeeId: In(protectedUserIds) },
          select: ['followeeId'],
        });
        followingSet = new Set(followees.map((f) => f.followeeId));
      }
      filtered = users.filter(
        (u) => !u.isProtected || u.id === userId || followingSet.has(u.id),
      );
    } else {
      filtered = users.filter((u) => !u.isProtected);
    }

    const hasMore = filtered.length > limitNum;
    const items = filtered.slice(0, limitNum).map((u) => ({
      ...u,
      reasons:
        sortBy === 'newest'
          ? ['Newest']
          : sortBy === 'cited'
            ? ['Most followed']
            : ['Topic overlap', 'Frequently quoted'],
    }));
    return { items, hasMore };
  }

  /**
   * Get "Quoted Now" posts - posts with high quote velocity
   * Score = quotes_last_6h * 1.0 + quotes_last_24h * 0.3
   */
  async getQuotedNow(
    userId?: string,
    limit = 20,
    filter?: { lang?: string; sort?: string; page?: string; limit?: string },
  ) {
    // If specific sort requested, bypass algo
    const langFilter = await this.getEffectiveLangFilter(userId, filter);
    const limitNum = filter?.limit
      ? Math.min(50, Math.max(1, parseInt(filter.limit, 10) || 20))
      : limit;
    const pageNum = Math.max(1, parseInt(filter?.page || '1', 10) || 1);
    const skip = (pageNum - 1) * limitNum;

    if (filter?.sort === 'newest') {
      const query = this.postRepo
        .createQueryBuilder('post')
        .innerJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .andWhere("author.handle NOT LIKE '__pending_%'")
        .orderBy('post.createdAt', 'DESC')
        .skip(skip)
        .take(limitNum + 1);
      if (langFilter?.length) {
        query.andWhere('post.lang IN (:...langs)', { langs: langFilter });
      }
      let posts = await query.getMany();
      posts = await this.filterPostsVisibleToViewer(posts, userId);
      const hasMore = posts.length > limitNum;
      const items = posts
        .slice(0, limitNum)
        .map((p) => ({ ...p, reasons: ['Latest'] as string[] }));
      return { items, hasMore };
    }

    if (filter?.sort === 'cited') {
      const query = this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .andWhere("author.handle NOT LIKE '__pending_%'")
        .orderBy('post.quoteCount', 'DESC')
        .skip(skip)
        .take(limitNum + 1);
      if (langFilter?.length) {
        query.andWhere('post.lang IN (:...langs)', { langs: langFilter });
      }
      let posts = await query.getMany();
      posts = await this.filterPostsVisibleToViewer(posts, userId);
      const hasMore = posts.length > limitNum;
      const items = posts
        .slice(0, limitNum)
        .map((p) => ({ ...p, reasons: ['Most cited'] as string[] }));
      return { items, hasMore };
    }

    // Recommended (Default Algo)
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calculate scores in DB using CASE statements
    const scoreExpr = `SUM(CASE WHEN edge.created_at >= :sixHoursAgo THEN 1.0 ELSE 0.3 END)`;

    // Cache the aggregation result (heavy query)
    const cacheKey = `explore:quoted-now:ids:${skip}:${limitNum}`;
    const scoredIds = await this.cached(cacheKey, 300, () =>
      this.postEdgeRepo
        .createQueryBuilder('edge')
        .select('edge.to_post_id', 'postId')
        .addSelect(scoreExpr, 'score')
        .where('edge.edge_type = :type', { type: EdgeType.QUOTE })
        .andWhere('edge.created_at >= :twentyFourHoursAgo', {
          twentyFourHoursAgo,
        })
        .setParameters({ sixHoursAgo, twentyFourHoursAgo })
        .groupBy('edge.to_post_id')
        .orderBy(scoreExpr, 'DESC')
        .offset(skip)
        .limit(limitNum + 1)
        .getRawMany<{ postId: string; score: number }>(),
    );

    if (scoredIds.length === 0) {
      return { items: [], hasMore: false };
    }

    const hasMoreAlgo = scoredIds.length > limitNum;
    const topPostIds = scoredIds.slice(0, limitNum).map((s) => s.postId);

    // Fetch full post data (exclude pending authors)
    const query = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id IN (:...ids)', { ids: topPostIds })
      .andWhere('post.deleted_at IS NULL')
      .andWhere(
        "(author.handle IS NULL OR author.handle NOT LIKE '__pending_%')",
      );

    if (langFilter?.length) {
      query.andWhere('post.lang IN (:...langs)', { langs: langFilter });
    }

    const posts = await query
      .orderBy(
        `CASE post.id ${topPostIds.map((id, idx) => `WHEN '${id}' THEN ${idx}`).join(' ')} END`,
      )
      .getMany();

    let result: (Post & { reasons?: string[] })[] = posts
      .filter((p) => !isPendingUser(p.author))
      .map((p) => ({
        ...p,
        reasons: ['Cited today', 'High quote velocity'],
      }));
    result = await this.filterPostsVisibleToViewer(result, userId);
    if (userId) {
      result = await this.applyPostPreferences(result, userId);
    }
    return { items: result, hasMore: hasMoreAlgo };
  }

  async getTrending(viewerId?: string, limit = 20): Promise<Post[]> {
    const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // last 3 days
    const qb = this.postRepo
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.author', 'author')
      .where('post.created_at >= :since', { since })
      .andWhere('post.deleted_at IS NULL')
      .andWhere("post.status = 'PUBLISHED'")
      .andWhere("author.handle NOT LIKE '__pending_%'");

    const posts = await qb
      .orderBy('post.quoteCount', 'DESC')
      .addOrderBy('post.replyCount', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .take(limit * 2)
      .getMany();

    return this.filterPostsVisibleToViewer(posts, viewerId);
  }

  /**
   * Get topic "Start here" posts - most cited posts in topic
   * Score = quote_count * 1.0 + backlinks * 0.2 + replies * 0.1
   * @param viewerId Optional; when provided, FOLLOWERS-only posts are included only if viewer follows the author.
   */
  async getTopicStartHere(
    topicId: string,
    limit = 10,
    viewerId?: string,
  ): Promise<Post[]> {
    // Get posts in topic (exclude pending authors)
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoin('post_topics', 'pt', 'pt.post_id = post.id')
      .where('pt.topic_id = :topicId', { topicId })
      .andWhere('post.deleted_at IS NULL')
      .innerJoinAndSelect('post.author', 'author')
      .andWhere("author.handle NOT LIKE '__pending_%'")
      .getMany();

    const visible = await this.filterPostsVisibleToViewer(posts, viewerId);

    // Get backlink counts from Neo4j or Postgres
    const postIds = visible.map((p) => p.id);
    if (postIds.length === 0) return [];
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
    const scored = visible.map((post) => ({
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
    filter?: { lang?: string; sort?: string; page?: string; limit?: string },
  ) {
    const langFilter = await this.getEffectiveLangFilter(userId, filter);
    const limitNum = filter?.limit
      ? Math.min(50, Math.max(1, parseInt(filter.limit, 10) || 20))
      : limit;
    const pageNum = Math.max(1, parseInt(filter?.page || '1', 10) || 1);
    const skip = (pageNum - 1) * limitNum;

    // Simple sort overrides (Latest = chronologically, paginated)
    if (filter?.sort === 'newest') {
      const query = this.postRepo
        .createQueryBuilder('post')
        .innerJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .andWhere("author.handle NOT LIKE '__pending_%'")
        .orderBy('post.createdAt', 'DESC')
        .skip(skip)
        .take(limitNum + 1);
      if (langFilter?.length) {
        query.andWhere('post.lang IN (:...langs)', { langs: langFilter });
      }
      let posts = await query.getMany();
      posts = await this.filterPostsVisibleToViewer(posts, userId);
      const hasMore = posts.length > limitNum;
      const items = posts
        .slice(0, limitNum)
        .map((p) => ({ ...p, reasons: ['Latest'] as string[] }));
      return { items, hasMore };
    }

    if (filter?.sort === 'cited') {
      const query = this.postRepo
        .createQueryBuilder('post')
        .innerJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .andWhere("author.handle NOT LIKE '__pending_%'")
        .orderBy('post.quoteCount', 'DESC')
        .skip(skip)
        .take(limitNum + 1);
      if (langFilter?.length) {
        query.andWhere('post.lang IN (:...langs)', { langs: langFilter });
      }
      let posts = await query.getMany();
      posts = await this.filterPostsVisibleToViewer(posts, userId);
      const hasMore = posts.length > limitNum;
      const items = posts
        .slice(0, limitNum)
        .map((p) => ({ ...p, reasons: ['Most cited'] as string[] }));
      return { items, hasMore };
    }

    // Default Algo: Get top posts by backlink count directly from DB
    const cacheKey = `explore:deep-dives:ids:${skip}:${limitNum}`;
    const rankedIds = await this.cached(cacheKey, 300, () =>
      this.postEdgeRepo
        .createQueryBuilder('edge')
        .select('edge.to_post_id', 'postId')
        .addSelect('COUNT(*)', 'count')
        .where('edge.edge_type = :type', { type: EdgeType.LINK })
        .groupBy('edge.to_post_id')
        .orderBy('COUNT(*)', 'DESC')
        .offset(skip)
        .limit(limitNum + 1)
        .getRawMany<{ postId: string; count: string }>(),
    );

    if (rankedIds.length === 0) {
      return { items: [], hasMore: false };
    }

    const hasMoreAlgo = rankedIds.length > limitNum;
    const postIds = rankedIds.slice(0, limitNum).map((r) => r.postId);

    // Fetch full post data for these IDs
    const langFilterDeep = await this.getEffectiveLangFilter(userId, filter);

    const query = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id IN (:...ids)', { ids: postIds })
      .andWhere('post.deleted_at IS NULL')
      .andWhere(
        "(author.handle IS NULL OR author.handle NOT LIKE '__pending_%')",
      );

    if (langFilterDeep?.length) {
      query.andWhere('post.lang IN (:...langs)', { langs: langFilterDeep });
    }

    const posts = await query.getMany();

    // Sort by original count order; exclude pending authors
    const sortedPosts = postIds
      .map((id) => posts.find((p) => p.id === id))
      .filter((p): p is Post => p !== undefined && !isPendingUser(p.author));

    let result: (Post & { reasons?: string[] })[] = sortedPosts.map((p) => ({
      ...p,
      reasons: ['Many backlinks', 'Link chain'],
    }));
    result = await this.filterPostsVisibleToViewer(result, userId);
    if (userId) {
      result = await this.applyPostPreferences(result, userId);
    }
    return { items: result, hasMore: hasMoreAlgo };
  }

  /**
   * Newsroom - recent posts with sources (external links)
   */
  async getNewsroom(
    userId?: string,
    limit = 20,
    filter?: { lang?: string; sort?: string; page?: string; limit?: string },
  ) {
    const langFilterNewsroom = await this.getEffectiveLangFilter(
      userId,
      filter,
    );
    const limitNum = filter?.limit
      ? Math.min(50, Math.max(1, parseInt(filter.limit, 10) || 20))
      : limit;
    const pageNum = Math.max(1, parseInt(filter?.page || '1', 10) || 1);
    const skip = (pageNum - 1) * limitNum;

    // Latest: chronologically sorted, paginated
    if (filter?.sort === 'newest') {
      const query = this.postRepo
        .createQueryBuilder('post')
        .innerJoin('external_sources', 'source', 'source.post_id = post.id')
        .innerJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .andWhere("author.handle NOT LIKE '__pending_%'")
        .orderBy('post.createdAt', 'DESC')
        .skip(skip)
        .take(limitNum + 1);
      if (langFilterNewsroom?.length) {
        query.andWhere('(post.lang IS NULL OR post.lang IN (:...langs))', {
          langs: langFilterNewsroom,
        });
      }
      let posts = await query.getMany();
      posts = await this.filterPostsVisibleToViewer(posts, userId);
      const hasMore = posts.length > limitNum;
      const items = posts
        .slice(0, limitNum)
        .map((p) => ({ ...p, reasons: ['Latest'] as string[] }));
      return { items, hasMore };
    }

    // Most cited: posts with sources by quote count
    if (filter?.sort === 'cited') {
      const idQuery = this.postRepo
        .createQueryBuilder('post')
        .innerJoin('external_sources', 'source', 'source.post_id = post.id')
        .where('post.deleted_at IS NULL')
        .orderBy('post.quoteCount', 'DESC')
        .skip(skip)
        .take(limitNum + 1);
      if (langFilterNewsroom?.length) {
        idQuery.andWhere('(post.lang IS NULL OR post.lang IN (:...langs))', {
          langs: langFilterNewsroom,
        });
      }
      const ids = await idQuery
        .select('post.id')
        .getRawMany<{ post_id: string }>();
      if (ids.length === 0) return { items: [], hasMore: false };
      const hasMore = ids.length > limitNum;
      const postIds = ids.slice(0, limitNum).map((i) => i.post_id);
      let posts = await this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.id IN (:...ids)', { ids: postIds })
        .andWhere(
          "(author.handle IS NULL OR author.handle NOT LIKE '__pending_%')",
        )
        .orderBy('post.quoteCount', 'DESC')
        .getMany();
      posts = posts.filter((p) => !isPendingUser(p.author));
      posts = await this.filterPostsVisibleToViewer(posts, userId);
      const items = posts.map((p) => ({
        ...p,
        reasons: ['Most cited'] as string[],
      }));
      return { items, hasMore };
    }

    // Default: recent posts with sources (recommended order)
    const orderBy = 'post.createdAt';
    const idQuery = this.postRepo
      .createQueryBuilder('post')
      .innerJoin('external_sources', 'source', 'source.post_id = post.id')
      .where('post.deleted_at IS NULL');

    if (langFilterNewsroom?.length) {
      idQuery.andWhere('(post.lang IS NULL OR post.lang IN (:...langs))', {
        langs: langFilterNewsroom,
      });
    }

    const cacheKey = `explore:newsroom:ids:${skip}:${limitNum}:${langFilterNewsroom?.join(',') || 'all'}`;
    const ids = await this.cached(cacheKey, 300, () =>
      idQuery
        .select('DISTINCT post.id', 'id')
        .orderBy(orderBy, 'DESC')
        .offset(skip)
        .limit(limitNum + 1)
        .getRawMany<{ id: string }>(),
    );

    if (ids.length === 0) return { items: [], hasMore: false };

    const hasMoreDefault = ids.length > limitNum;
    const idList = ids.slice(0, limitNum).map((i) => i.id);

    const finalPosts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id IN (:...ids)', { ids: idList })
      .andWhere(
        "(author.handle IS NULL OR author.handle NOT LIKE '__pending_%')",
      )
      .orderBy(orderBy, 'DESC')
      .getMany();

    let result: (Post & { reasons?: string[] })[] = finalPosts
      .filter((p) => !isPendingUser(p.author))
      .map((p) => ({
        ...p,
        reasons: ['Recent sources', 'External links'],
      }));
    result = await this.filterPostsVisibleToViewer(result, userId);
    if (userId) {
      result = await this.applyPostPreferences(result, userId);
    }
    return { items: result, hasMore: hasMoreDefault };
  }

  /**
   * Newest – most recent posts from the user's interested (followed) topics, in chronological order.
   * If the user has no followed topics (or is not logged in), returns all recent posts.
   */
  async getNewest(
    userId?: string,
    limit = 20,
    filter?: { page?: string; limit?: string },
  ): Promise<{ items: (Post & { reasons?: string[] })[]; hasMore: boolean }> {
    const limitNum = filter?.limit
      ? Math.min(50, Math.max(1, parseInt(filter.limit, 10) || 20))
      : limit;
    const pageNum = Math.max(1, parseInt(filter?.page || '1', 10) || 1);
    const skip = (pageNum - 1) * limitNum;

    let followedTopicIds: string[] = [];
    if (userId) {
      const follows = await this.topicFollowRepo.find({
        where: { userId },
        select: ['topicId'],
      });
      followedTopicIds = follows.map((f) => f.topicId);
    }

    if (followedTopicIds.length > 0) {
      const subQuery = this.dataSource
        .createQueryBuilder()
        .select('pt.post_id')
        .from(PostTopic, 'pt')
        .where('pt.topic_id IN (:...topicIds)', { topicIds: followedTopicIds });
      const postIds = await this.postRepo
        .createQueryBuilder('post')
        .select('post.id', 'id')
        .where(`post.id IN (${subQuery.getQuery()})`)
        .setParameters(subQuery.getParameters())
        .andWhere('post.deleted_at IS NULL')
        .orderBy('post.createdAt', 'DESC')
        .offset(skip)
        .limit(limitNum + 1)
        .getRawMany<{ id: string }>();
      const ids = postIds.map((r) => r.id);
      if (ids.length === 0) return { items: [], hasMore: false };
      const hasMore = ids.length > limitNum;
      const idList = ids.slice(0, limitNum);
      let posts = await this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.id IN (:...ids)', { ids: idList })
        .andWhere(
          "(author.handle IS NULL OR author.handle NOT LIKE '__pending_%')",
        )
        .orderBy('post.createdAt', 'DESC')
        .getMany();
      posts = posts.filter((p) => !isPendingUser(p.author));
      posts = await this.filterPostsVisibleToViewer(posts, userId);
      const orderMap = new Map(idList.map((id, i) => [id, i]));
      posts.sort(
        (a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99),
      );
      const items = posts.map((p) => ({
        ...p,
        reasons: ['From your topics'] as string[],
      }));
      return { items, hasMore };
    }

    const query = this.postRepo
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.author', 'author')
      .where('post.deleted_at IS NULL')
      .andWhere("author.handle NOT LIKE '__pending_%'")
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limitNum + 1);

    let posts = await query.getMany();
    posts = await this.filterPostsVisibleToViewer(posts, userId);
    const hasMore = posts.length > limitNum;
    const items = posts.slice(0, limitNum).map((p) => ({
      ...p,
      reasons: ['Latest'] as string[],
    }));
    return { items, hasMore };
  }
}
