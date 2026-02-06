import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { Post } from '../entities/post.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { PostEdge, EdgeType } from '../entities/post-edge.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { ExploreService } from '../explore/explore.service';
import { GraphComputeService } from '../graph/graph-compute.service';
import { UploadService } from '../upload/upload.service';

export type TopicSourceItem =
  | {
      type: 'external';
      id: string;
      url: string;
      title: string | null;
      createdAt: Date;
    }
  | {
      type: 'post';
      id: string;
      title: string | null;
      createdAt: Date;
      headerImageKey: string | null;
      authorHandle: string | null;
    }
  | {
      type: 'topic';
      id: string;
      slug: string;
      title: string;
      createdAt: Date;
    };

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(PostTopic) private postTopicRepo: Repository<PostTopic>,
    @InjectRepository(PostEdge) private postEdgeRepo: Repository<PostEdge>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(ExternalSource)
    private externalSourceRepo: Repository<ExternalSource>,
    private exploreService: ExploreService,
    private graphCompute: GraphComputeService,
    private uploadService: UploadService,
  ) {}

  async findOne(slugOrId: string, viewerId?: string) {
    let topic: Topic | null = null;
    try {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          slugOrId,
        );
      topic = await this.topicRepo.findOne({
        where: isUuid ? { id: slugOrId } : { slug: slugOrId },
      });
    } catch (err) {
      this.logger.warn('Topic findOne lookup failed', slugOrId, err);
      return null;
    }

    if (!topic) return null;

    let startHere: Post[] = [];
    let recentPostData: {
      id: string;
      title: string | null;
      bodyExcerpt: string;
      headerImageKey: string | null;
    } | null = null;
    let postCount = 0;
    let contributorCount = 0;
    let relatedTopics: Array<{ topic: string; strength: number }> = [];

    try {
      // Run all enrichment queries in parallel for speed
      const [
        startHereResult,
        recentResult,
        postCountRow,
        contributorRow,
        relatedResult,
      ] = await Promise.all([
        this.exploreService.getTopicStartHere(topic.id, 10, viewerId),
        this.getRecentPostForTopic(topic.id, viewerId),
        this.postTopicRepo
          .createQueryBuilder('pt')
          .innerJoin(Post, 'p', 'p.id = pt.post_id AND p.deleted_at IS NULL')
          .where('pt.topic_id = :topicId', { topicId: topic.id })
          .select('COUNT(DISTINCT pt.post_id)', 'cnt')
          .cache(60000) // Cache count for 1 min
          .getRawOne<{ cnt: string }>(),
        this.postRepo.manager
          .createQueryBuilder()
          .select('COUNT(DISTINCT p.author_id)', 'cnt')
          .from(PostTopic, 'pt')
          .innerJoin(Post, 'p', 'p.id = pt.post_id AND p.deleted_at IS NULL')
          .where('pt.topic_id = :topicId', { topicId: topic.id })
          .cache(60000) // Cache count for 1 min
          .getRawOne<{ cnt: string }>(),
        this.graphCompute.getRelatedTopics(topic.slug),
      ]);
      startHere = startHereResult;
      recentPostData = recentResult;
      postCount = postCountRow ? parseInt(postCountRow.cnt, 10) : 0;
      contributorCount = contributorRow ? parseInt(contributorRow.cnt, 10) : 0;
      relatedTopics = relatedResult;
    } catch (err) {
      this.logger.warn(`Topic findOne enrichment failed for ${topic.id}`, err);
    }

    const recentPostImageUrl =
      recentPostData?.headerImageKey != null &&
      recentPostData.headerImageKey !== ''
        ? this.uploadService.getImageUrl(recentPostData.headerImageKey)
        : null;
    const recentPost = recentPostData
      ? {
          ...recentPostData,
          headerImageUrl:
            recentPostData.headerImageKey != null &&
            recentPostData.headerImageKey !== ''
              ? this.uploadService.getImageUrl(recentPostData.headerImageKey)
              : null,
        }
      : null;

    return {
      ...topic,
      startHere,
      recentPostImageKey: recentPostData?.headerImageKey ?? null,
      recentPostImageUrl: recentPostImageUrl ?? null,
      recentPost,
      postCount,
      contributorCount,
      relatedTopics,
    };
  }

  /**
   * Get the single most recent post (by created_at) in this topic for header/preview.
   * Respects visibility from author profile (public vs protected).
   */
  async getRecentPostForTopic(
    topicId: string,
    viewerId?: string,
  ): Promise<{
    id: string;
    title: string | null;
    bodyExcerpt: string;
    headerImageKey: string | null;
  } | null> {
    const qb = this.postRepo
      .createQueryBuilder('post')
      .innerJoin('post_topics', 'pt', 'pt.post_id = post.id')
      .innerJoin('post.author', 'author')
      .where('pt.topic_id = :topicId', { topicId })
      .andWhere('post.deleted_at IS NULL');

    // SQL-level visibility filter
    if (viewerId) {
      qb.andWhere(
        `(author.is_protected = false OR author.id = :viewerId OR EXISTS (
          SELECT 1 FROM follows f WHERE f.follower_id = :viewerId AND f.followee_id = author.id
        ))`,
        { viewerId },
      );
    } else {
      qb.andWhere('author.is_protected = false');
    }

    const p = await qb.orderBy('post.createdAt', 'DESC').limit(1).getOne();
    if (!p) return null;
    const body = p.body;
    const bodyExcerpt =
      body && typeof body === 'string'
        ? body
            .replace(/#{1,6}\s*/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            .replace(/\n+/g, ' ')
            .trim()
            .slice(0, 120) + (body.length > 120 ? '…' : '')
        : '';
    return {
      id: p.id,
      title: p.title ?? null,
      bodyExcerpt,
      headerImageKey: p.headerImageKey ?? null,
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
    viewerId?: string,
  ) {
    try {
      let topicId = topicIdOrSlug;

      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          topicIdOrSlug,
        );

      if (!isUUID) {
        const topic = await this.topicRepo.findOne({
          where: { slug: topicIdOrSlug },
        });
        if (topic) {
          topicId = topic.id;
        } else {
          return { items: [], hasMore: false };
        }
      }

      const query = this.postRepo
        .createQueryBuilder('post')
        .innerJoin('post_topics', 'pt', 'pt.post_id = post.id')
        .leftJoinAndSelect('post.author', 'author')
        .where('pt.topic_id = :topicId', { topicId })
        .andWhere('post.deleted_at IS NULL');

      if (sort === 'ranked') {
        this.logger.log(`Applying spam/quality gate for topic ${topicId}`);
        query.andWhere(
          "(post.quote_count > 0 OR post.reply_count > 0 OR author.created_at < NOW() - INTERVAL '7 days')",
        );
        query.orderBy('(post.quoteCount * 3 + post.replyCount)', 'DESC');
        query.addOrderBy('post.createdAt', 'DESC');
      } else {
        query.orderBy('post.createdAt', 'DESC');
      }

      // Apply visibility filter at SQL level to avoid over-fetching
      if (viewerId) {
        query.andWhere(
          `(author.is_protected = false OR author.id = :viewerId OR EXISTS (
            SELECT 1 FROM follows f WHERE f.follower_id = :viewerId AND f.followee_id = author.id
          ))`,
          { viewerId },
        );
      } else {
        query.andWhere('author.is_protected = false');
      }

      const posts = await query
        .skip(offset)
        .take(limit + 1)
        .getMany();
      const hasMore = posts.length > limit;
      const items = posts.slice(0, limit);
      return { items, hasMore };
    } catch (err) {
      this.logger.warn('getTopicPosts failed', topicIdOrSlug, sort, err);
      return { items: [], hasMore: false };
    }
  }

  async getTopicPeople(
    topicId: string,
    limit = 20,
    offset = 0,
    viewerId?: string,
  ) {
    // Find authors who post frequently in this topic and have high engagement.
    // Fetch extra rows so we can filter out protected users when needed.
    const fetchLimit = viewerId ? limit * 2 : limit;
    const builder = this.postRepo.manager
      .createQueryBuilder()
      .select('author.id', 'id')
      .addSelect('author.handle', 'handle')
      .addSelect('author.display_name', 'displayName')
      .addSelect('author.avatar_key', 'avatarKey')
      .addSelect('COUNT(post.id)', 'postCount')
      .addSelect('SUM(post.quote_count)', 'totalQuotes')
      .from(Post, 'post')
      .innerJoin('post.author', 'author')
      .innerJoin('post_topics', 'pt', 'pt.post_id = post.id')
      .where('pt.topic_id = :topicId', { topicId })
      .andWhere('post.deleted_at IS NULL')
      .andWhere('author.is_protected = :prot', { prot: false })
      .groupBy('author.id')
      .addGroupBy('author.handle')
      .addGroupBy('author.display_name')
      .addGroupBy('author.avatar_key')
      .orderBy('SUM(post.quoteCount)', 'DESC')
      .addOrderBy('COUNT(post.id)', 'DESC')
      .limit(fetchLimit)
      .offset(offset);

    const raw = await builder.getRawMany<{
      id: string;
      handle: string;
      displayName: string;
      avatarKey: string | null;
      postCount: string;
      totalQuotes: string;
    }>();
    if (raw.length === 0) return [];

    const authorIds = [...new Set(raw.map((r) => r.id))];
    const users = await this.userRepo.find({
      where: { id: In(authorIds) },
      select: ['id', 'isProtected'],
    });
    const protectedSet = new Set(
      users.filter((u) => u.isProtected).map((u) => u.id),
    );
    let followingSet = new Set<string>();
    if (viewerId && protectedSet.size > 0) {
      const followees = await this.followRepo.find({
        where: {
          followerId: viewerId,
          followeeId: In([...protectedSet]),
        },
        select: ['followeeId'],
      });
      followingSet = new Set(followees.map((f) => f.followeeId));
    }
    const visible = raw.filter(
      (r) =>
        !protectedSet.has(r.id) || r.id === viewerId || followingSet.has(r.id),
    );
    return visible.slice(0, limit).map((r) => ({
      id: r.id,
      handle: r.handle,
      displayName: r.displayName,
      avatarKey: r.avatarKey ?? null,
      postCount: parseInt(r.postCount, 10),
      totalQuotes: parseInt(r.totalQuotes, 10),
    }));
  }

  async getTopicSources(
    topicIdOrSlug: string,
    limit = 20,
    offset = 0,
    viewerId?: string,
  ): Promise<TopicSourceItem[]> {
    let topicId = topicIdOrSlug;
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        topicIdOrSlug,
      );
    if (!isUUID) {
      const topic = await this.topicRepo.findOne({
        where: { slug: topicIdOrSlug },
      });
      if (!topic) return [];
      topicId = topic.id;
    }

    // 1) Visible post IDs in this topic (for viewer filtering)
    const topicPostIds = await this.postTopicRepo
      .find({ where: { topicId }, select: ['postId'] })
      .then((rows) => rows.map((r) => r.postId));
    if (topicPostIds.length === 0) return [];

    let visiblePostIds: Set<string>;
    if (viewerId) {
      const posts = await this.postRepo.find({
        where: { id: In(topicPostIds) },
        relations: ['author'],
        select: ['id', 'authorId'],
      });
      const visible = await this.exploreService.filterPostsVisibleToViewer(
        posts,
        viewerId,
      );
      visiblePostIds = new Set(visible.map((p) => p.id));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const publicIds: Array<{ id: string }> = await this.postRepo.query(
        `
        SELECT p.id FROM posts p
        INNER JOIN users u ON u.id = p.author_id AND u.is_protected = false
        WHERE p.id = ANY($1::uuid[]) AND p.deleted_at IS NULL
        `,
        [topicPostIds],
      );
      visiblePostIds = new Set(publicIds.map((r) => r.id));
    }

    const publicClause = viewerId
      ? ''
      : `INNER JOIN users postAuthor ON postAuthor.id = p.author_id AND postAuthor.is_protected = false`;

    // 2) External sources (distinct by url) from visible topic posts
    const extQuery =
      viewerId === undefined
        ? `
      WITH distinct_sources AS (
        SELECT DISTINCT ON (es.url) es.id, es.url, es.title, es.created_at, es.post_id AS "postId"
        FROM external_sources es
        INNER JOIN post_topics pt ON pt.post_id = es.post_id
        INNER JOIN posts p ON p.id = es.post_id AND p.deleted_at IS NULL
        ${publicClause}
        WHERE pt.topic_id = $1
        ORDER BY es.url, es.created_at DESC
      )
      SELECT id, url, title, created_at AS "createdAt", "postId" FROM distinct_sources ORDER BY "createdAt" DESC
      `
        : `
      WITH distinct_sources AS (
        SELECT DISTINCT ON (es.url) es.id, es.url, es.title, es.created_at, es.post_id AS "postId"
        FROM external_sources es
        INNER JOIN post_topics pt ON pt.post_id = es.post_id
        INNER JOIN posts p ON p.id = es.post_id AND p.deleted_at IS NULL
        WHERE pt.topic_id = $1 AND es.post_id = ANY($2::uuid[])
        ORDER BY es.url, es.created_at DESC
      )
      SELECT id, url, title, created_at AS "createdAt", "postId" FROM distinct_sources ORDER BY "createdAt" DESC
      `;
    const extParams =
      viewerId === undefined ? [topicId] : [topicId, [...visiblePostIds]];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const extRows: Array<{
      id: string;
      url: string;
      title: string;
      createdAt: string;
    }> = await this.externalSourceRepo.query(extQuery, extParams);
    const externalItems: TopicSourceItem[] = extRows.map((r) => ({
      type: 'external' as const,
      id: r.id,
      url: r.url,
      title: r.title,
      createdAt: new Date(r.createdAt),
    }));

    // 3) Linked posts (LINK edges from visible topic posts); dedupe by to_post_id
    const edges = await this.postEdgeRepo.find({
      where: {
        fromPostId: In([...visiblePostIds]),
        edgeType: EdgeType.LINK,
      },
      relations: ['toPost', 'toPost.author'],
      order: { createdAt: 'DESC' },
    });
    const toPostIds = [...new Set(edges.map((e) => e.toPostId))];
    const toPosts = await this.postRepo.find({
      where: { id: In(toPostIds) },
      relations: ['author'],
      select: ['id', 'title', 'createdAt', 'headerImageKey', 'authorId'],
    });
    const visibleToPosts = await this.exploreService.filterPostsVisibleToViewer(
      toPosts,
      viewerId,
    );
    const visibleToPostIds = new Set(visibleToPosts.map((p) => p.id));
    const authorHandles = new Map<string, string>();
    for (const p of visibleToPosts) {
      if (p.author?.handle) authorHandles.set(p.id, p.author.handle);
    }
    const postItems: TopicSourceItem[] = [];
    const seenPostIds = new Set<string>();
    for (const e of edges) {
      if (!visibleToPostIds.has(e.toPostId) || seenPostIds.has(e.toPostId))
        continue;
      seenPostIds.add(e.toPostId);
      const post = e.toPost;
      if (!post) continue;
      postItems.push({
        type: 'post',
        id: post.id,
        title: post.title ?? null,
        createdAt: e.createdAt,
        headerImageKey: post.headerImageKey ?? null,
        authorHandle: authorHandles.get(post.id) ?? null,
      });
    }

    // 4) Other topics tagged on visible topic posts (post_topic where topic_id != this topic)
    const otherTopicLinks = await this.postTopicRepo
      .createQueryBuilder('pt')
      .select('pt.topic_id', 'topicId')
      .where('pt.post_id IN (:...postIds)', {
        postIds: [...visiblePostIds],
      })
      .andWhere('pt.topic_id != :topicId', { topicId })
      .groupBy('pt.topic_id')
      .getRawMany<{ topicId: string }>();
    const otherTopicIds = otherTopicLinks.map((r) => r.topicId);
    const topics =
      otherTopicIds.length === 0
        ? []
        : await this.topicRepo.find({
            where: { id: In(otherTopicIds) },
            select: ['id', 'slug', 'title', 'createdAt'],
          });
    const topicItems: TopicSourceItem[] = topics.map((t) => ({
      type: 'topic',
      id: t.id,
      slug: t.slug,
      title: t.title,
      createdAt: t.createdAt,
    }));

    // 5) Merge, sort by createdAt desc, dedupe by (type, id), paginate
    const merged: TopicSourceItem[] = [
      ...externalItems,
      ...postItems,
      ...topicItems,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const seen = new Set<string>();
    const deduped = merged.filter((item) => {
      const key =
        item.type === 'external'
          ? `ext:${item.url}`
          : `${item.type}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return deduped.slice(offset, offset + limit);
  }
}
