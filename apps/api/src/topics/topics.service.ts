import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { Post } from '../entities/post.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { ExploreService } from '../explore/explore.service';

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(PostTopic) private postTopicRepo: Repository<PostTopic>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(ExternalSource)
    private externalSourceRepo: Repository<ExternalSource>,
    private exploreService: ExploreService,
  ) {}

  async findOne(slugOrId: string, viewerId?: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slugOrId,
      );
    const topic = await this.topicRepo.findOne({
      where: isUuid ? { id: slugOrId } : { slug: slugOrId },
    });

    if (!topic) return null;

    // Get "Start here" posts (most cited) - re-using explore service logic; filter by viewer visibility
    const startHere = await this.exploreService.getTopicStartHere(
      topic.id,
      10,
      viewerId,
    );

    // Header image = most recent post's header image (by post.created_at)
    const recentPostData = await this.getRecentPostForTopic(topic.id, viewerId);

    const [postCountRow, contributorRow] = await Promise.all([
      this.postTopicRepo
        .createQueryBuilder('pt')
        .innerJoin(Post, 'p', 'p.id = pt.post_id AND p.deleted_at IS NULL')
        .innerJoin(
          User,
          'author',
          'author.id = p.author_id AND author.is_protected = false',
        )
        .where('pt.topic_id = :topicId', { topicId: topic.id })
        .select('COUNT(DISTINCT pt.post_id)', 'cnt')
        .getRawOne<{ cnt: string }>(),
      this.postRepo.manager
        .createQueryBuilder()
        .select('COUNT(DISTINCT author.id)', 'cnt')
        .from(PostTopic, 'pt')
        .innerJoin(Post, 'p', 'p.id = pt.post_id AND p.deleted_at IS NULL')
        .innerJoin(
          User,
          'author',
          'author.id = p.author_id AND author.is_protected = false',
        )
        .where('pt.topic_id = :topicId', { topicId: topic.id })
        .getRawOne<{ cnt: string }>(),
    ]);

    return {
      ...topic,
      startHere,
      recentPostImageKey: recentPostData?.headerImageKey ?? null,
      recentPost: recentPostData ?? null,
      postCount: postCountRow ? parseInt(postCountRow.cnt, 10) : 0,
      contributorCount: contributorRow ? parseInt(contributorRow.cnt, 10) : 0,
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
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .innerJoin('post_topics', 'pt', 'pt.post_id = post.id')
      .where('pt.topic_id = :topicId', { topicId })
      .andWhere('post.deleted_at IS NULL')
      .orderBy('post.created_at', 'DESC')
      .limit(20)
      .getMany();
    const visible = await this.exploreService.filterPostsVisibleToViewer(
      posts,
      viewerId,
    );
    const p = visible[0] ?? null;
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
    let topicId = topicIdOrSlug;

    // Check if it's a valid UUID
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        topicIdOrSlug,
      );

    if (!isUUID) {
      // Resolve slug to ID
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
      // Spam/Quality Filter
      this.logger.log(`Applying spam/quality gate for topic ${topicId}`);

      // 1. Account Age > 3 days OR has significant engagement
      // We can't easily check account age in DB if not indexed or simple.
      // Let's rely on engagement metrics.

      // Ranking Score: quote_count * 3 + reply_count * 1
      // We also enforce a "gate": must have at least 1 quote OR 1 reply OR author created > 7 days ago

      // PostgreSQL specific date check
      query.andWhere(
        "(post.quote_count > 0 OR post.reply_count > 0 OR author.created_at < NOW() - INTERVAL '7 days')",
      );

      // Order by ranking score without adding non-entity column (avoids getMany() issues)
      query.orderBy('(post.quote_count * 3 + post.reply_count)', 'DESC');
      query.addOrderBy('post.created_at', 'DESC');
    } else {
      // Recent
      query.orderBy('post.created_at', 'DESC');
    }

    const takeCount = viewerId ? (limit + 1) * 3 : limit + 1;
    const posts = await query.skip(offset).take(takeCount).getMany();
    const visible = await this.exploreService.filterPostsVisibleToViewer(
      posts,
      viewerId,
    );
    const hasMore = visible.length > limit;
    const items = visible.slice(0, limit);
    return { items, hasMore };
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
      .addSelect('COUNT(post.id)', 'postCount')
      .addSelect('SUM(post.quote_count)', 'totalQuotes')
      .from(Post, 'post')
      .innerJoin('post.author', 'author')
      .innerJoin('post_topics', 'pt', 'pt.post_id = post.id')
      .where('pt.topic_id = :topicId', { topicId })
      .andWhere('post.deleted_at IS NULL')
      .andWhere('author.is_protected = :prot', { prot: false })
      .groupBy('author.id')
      .orderBy('"totalQuotes"', 'DESC')
      .addOrderBy('"postCount"', 'DESC')
      .limit(fetchLimit)
      .offset(offset);

    const raw = await builder.getRawMany<{
      id: string;
      handle: string;
      displayName: string;
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
      postCount: parseInt(r.postCount, 10),
      totalQuotes: parseInt(r.totalQuotes, 10),
    }));
  }

  async getTopicSources(
    topicIdOrSlug: string,
    limit = 20,
    offset = 0,
    viewerId?: string,
  ): Promise<
    { id: string; url: string; title: string | null; createdAt: Date }[]
  > {
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

    const qb = this.externalSourceRepo
      .createQueryBuilder('es')
      .innerJoin('post_topics', 'pt', 'pt.post_id = es.post_id')
      .innerJoin(Post, 'p', 'p.id = es.post_id AND p.deleted_at IS NULL')
      .where('pt.topic_id = :topicId', { topicId })
      .select('es.id', 'id')
      .addSelect('es.url', 'url')
      .addSelect('es.title', 'title')
      .addSelect('es.created_at', 'createdAt')
      .addSelect('es.post_id', 'postId')
      .orderBy('es.created_at', 'DESC');
    if (!viewerId) {
      qb.innerJoin(
        User,
        'postAuthor',
        'postAuthor.id = p.author_id AND postAuthor.is_protected = false',
      );
    }
    const rows = await qb
      .skip(offset)
      .take(viewerId ? limit * 3 : limit)
      .getRawMany<{
        id: string;
        url: string;
        title: string | null;
        createdAt: Date;
        postId: string;
      }>();

    if (rows.length === 0) return [];
    const toSource = (r: {
      id: string;
      url: string;
      title: string | null;
      createdAt: Date;
      postId: string;
    }) => ({
      id: r.id,
      url: r.url,
      title: r.title,
      createdAt: r.createdAt,
    });
    if (!viewerId) return rows.slice(0, limit).map(toSource);

    const postIds = [...new Set(rows.map((r) => r.postId))];
    const posts = await this.postRepo.find({
      where: { id: In(postIds) },
      relations: ['author'],
      select: ['id', 'authorId'],
    });
    const visible = await this.exploreService.filterPostsVisibleToViewer(
      posts,
      viewerId,
    );
    const visiblePostIds = new Set(visible.map((p) => p.id));
    const filtered = rows.filter((r) => visiblePostIds.has(r.postId));
    return filtered.slice(0, limit).map(toSource);
  }
}
