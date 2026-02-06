/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Post, PostVisibility } from '../entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostEdge, EdgeType } from '../entities/post-edge.entity';
import { Topic } from '../entities/topic.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { User } from '../entities/user.entity';
import { Mention } from '../entities/mention.entity';
import { Neo4jService } from '../database/neo4j.service';
import { Neo4jQueryService } from '../database/neo4j-query.service';
import { LanguageDetectionService } from '../shared/language-detection.service';
import { MeilisearchService } from '../search/meilisearch.service';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { SafetyService } from '../safety/safety.service';
import { EmbeddingService } from '../shared/embedding.service';
import { IEventBus, EVENT_BUS } from '../common/event-bus/event-bus.interface';

import { UpdatePostDto } from './dto/update-post.dto';
import { EntityManager } from 'typeorm';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(ExternalSource)
    private externalSourceRepo: Repository<ExternalSource>,
    @InjectRepository(Mention) private mentionRepo: Repository<Mention>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
    private neo4jService: Neo4jService,
    private neo4jQuery: Neo4jQueryService,
    private languageDetection: LanguageDetectionService,
    private meilisearch: MeilisearchService,
    private notificationHelper: NotificationHelperService,
    private safetyService: SafetyService,
    private embeddingService: EmbeddingService,
    private configService: ConfigService,
    @Inject(EVENT_BUS) private eventBus: IEventBus,
  ) {}

  async create(
    userId: string,
    dto: CreatePostDto,
    skipQueue = false,
    skipSafety = false,
  ): Promise<Post> {
    // Sanitize HTML in body
    const { default: DOMPurify } = await import('isomorphic-dompurify');
    const sanitizedBody = DOMPurify.sanitize(dto.body, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });

    // AI Safety Check: sync (Stage 1 only) unless async (default: async for faster perceived creation; worker does full check)
    const contentModerationAsync =
      this.configService.get<string>('MODERATION_CONTENT_ASYNC') !== 'false';
    if (!skipSafety && !contentModerationAsync) {
      const safety = await this.safetyService.checkContent(
        sanitizedBody,
        userId,
        'post',
        { onlyFast: true },
      );
      if (!safety.safe) {
        throw new BadRequestException(
          safety.reason || 'Content flagged by safety check',
        );
      }
    }

    // Rate Limit: Topic References (Anti-Spam)
    if (dto.status !== 'DRAFT') {
      type CountRow = { count: string };
      const rawRefs = await this.dataSource.query(
        `SELECT COUNT(*) as count 
         FROM post_topics pt
         JOIN posts p ON pt.post_id = p.id
         WHERE p.author_id = $1 AND p.created_at > NOW() - INTERVAL '1 hour'`,
        [userId],
      );
      const recentTopicRefs: CountRow[] = Array.isArray(rawRefs)
        ? (rawRefs as CountRow[])
        : [];
      const recentCount =
        recentTopicRefs.length > 0 ? recentTopicRefs[0].count : '0';
      if (parseInt(recentCount, 10) >= 100) {
        const hasTopics = /\[\[(?!post:)(.*?)\]\]/.test(sanitizedBody);
        if (hasTopics) {
          throw new BadRequestException(
            'You have reached the limit for topic references this hour.',
          );
        }
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedPost: Post;

    try {
      // 1. Parse Title
      const titleMatch = sanitizedBody.match(/^#\s+(.+)$/m);
      const title = titleMatch
        ? DOMPurify.sanitize(titleMatch[1].trim(), { ALLOWED_TAGS: [] })
        : null;

      // 2. Detect Language
      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: ['languages'],
      });
      const { lang, confidence } = await this.languageDetection.detectLanguage(
        sanitizedBody,
        userId,
        user?.languages || [],
      );

      const wordCount = sanitizedBody.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      // 3. Create Post
      const post = this.postRepo.create({
        authorId: userId,
        body: sanitizedBody,
        title: title,
        headerImageKey: dto.headerImageKey,
        headerImageBlurhash: dto.headerImageBlurhash,
        visibility: PostVisibility.PUBLIC, // Visibility is from author profile only; column kept for DB compatibility
        lang: lang,
        langConfidence: confidence,
        readingTimeMinutes: readingTime,
        status: dto.status ?? 'PUBLISHED',
        media: dto.media ?? null,
        contentWarning: dto.contentWarning?.trim() || null,
      });

      // Explicitly save as single entity
      savedPost = (await queryRunner.manager.save(
        Post,
        post,
      )) as unknown as Post;

      if (savedPost.status === 'PUBLISHED') {
        await this.processPublishedPost(savedPost, queryRunner.manager, userId);
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    if (savedPost.status === 'PUBLISHED' && !skipQueue) {
      await this.eventBus.publish('post-processing', 'process', {
        postId: savedPost.id,
        userId,
      });
      // Index immediately so the post is searchable before the worker runs (worker will overwrite with embedding/topicIds).
      this.postRepo
        .findOne({
          where: { id: savedPost.id },
          relations: ['author', 'postTopics'],
          select: {
            id: true,
            title: true,
            body: true,
            authorId: true,
            lang: true,
            createdAt: true,
            quoteCount: true,
            replyCount: true,
            readingTimeMinutes: true,
            status: true,
            author: {
              id: true,
              handle: true,
              displayName: true,
              isProtected: true,
            },
          },
        })
        .then((post) => {
          if (!post) return;
          const topicIds = post.postTopics?.map((pt) => pt.topicId) ?? [];
          return this.meilisearch.indexPost({
            id: post.id,
            title: post.title,
            body: post.body,
            authorId: post.authorId || '',
            author: post.author
              ? {
                  displayName: post.author.displayName ?? post.author.handle,
                  handle: post.author.handle,
                }
              : undefined,
            authorProtected: post.author?.isProtected,
            lang: post.lang,
            createdAt: post.createdAt,
            quoteCount: post.quoteCount,
            replyCount: post.replyCount,
            readingTimeMinutes: post.readingTimeMinutes,
            topicIds,
            status: post.status,
          });
        })
        .catch((err) =>
          this.logger.warn(
            'Immediate post index failed (worker will index)',
            err,
          ),
        );
    }

    return savedPost;
  }

  async update(userId: string, id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id, authorId: userId },
    });
    if (!post) throw new NotFoundException('Post not found or unauthorized');

    const wasDraft = post.status === 'DRAFT';
    const isPublishing = wasDraft && dto.status === 'PUBLISHED';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.body) {
        const { default: DOMPurify } = await import('isomorphic-dompurify');
        post.body = DOMPurify.sanitize(dto.body, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
          KEEP_CONTENT: true,
        });

        // Update Title/Stats if body changed
        const titleMatch = post.body.match(/^#\s+(.+)$/m);
        post.title = titleMatch
          ? DOMPurify.sanitize(titleMatch[1].trim(), { ALLOWED_TAGS: [] })
          : null;
        const wordCount = post.body.split(/\s+/).length;
        post.readingTimeMinutes = Math.ceil(wordCount / 200);
      }

      // Visibility is from author profile only; do not allow per-post override
      if (dto.headerImageKey !== undefined)
        post.headerImageKey = dto.headerImageKey;
      if (dto.media !== undefined) post.media = dto.media;
      if (dto.status) post.status = dto.status;

      const savedPost = await queryRunner.manager.save(Post, post);

      if (isPublishing) {
        await this.processPublishedPost(savedPost, queryRunner.manager, userId);
      }

      await queryRunner.commitTransaction();

      if (isPublishing) {
        await this.eventBus.publish('post-processing', 'process', {
          postId: savedPost.id,
          userId,
        });
        // Index immediately so the post is searchable before the worker runs.
        this.postRepo
          .findOne({
            where: { id: savedPost.id },
            relations: ['author', 'postTopics'],
            select: {
              id: true,
              title: true,
              body: true,
              authorId: true,
              lang: true,
              createdAt: true,
              quoteCount: true,
              replyCount: true,
              readingTimeMinutes: true,
              status: true,
              author: {
                id: true,
                handle: true,
                displayName: true,
                isProtected: true,
              },
            },
          })
          .then((post) => {
            if (!post) return;
            const topicIds = post.postTopics?.map((pt) => pt.topicId) ?? [];
            return this.meilisearch.indexPost({
              id: post.id,
              title: post.title,
              body: post.body,
              authorId: post.authorId || '',
              author: post.author
                ? {
                    displayName: post.author.displayName ?? post.author.handle,
                    handle: post.author.handle,
                  }
                : undefined,
              authorProtected: post.author?.isProtected,
              lang: post.lang,
              createdAt: post.createdAt,
              quoteCount: post.quoteCount,
              replyCount: post.replyCount,
              readingTimeMinutes: post.readingTimeMinutes,
              topicIds,
              status: post.status,
            });
          })
          .catch((err) =>
            this.logger.warn(
              'Immediate post index on publish failed (worker will index)',
              err,
            ),
          );
      }

      return savedPost;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Extract sources from post body on creation and persist to DB (and later to Neo4j via post worker).
   * - [[post:uuid]] → PostEdge (LINK); [[url]] or [text](url)/[url](text) → ExternalSource; [[Topic]] → PostTopic + Topic.
   * - @handle → Mention.
   * Post worker then syncs: Post–IN_TOPIC→Topic, Post–LINKS_TO/QUOTES→Post, Post–MENTIONS→User, Post–CITES_EXTERNAL→ExternalUrl.
   */
  private async processPublishedPost(
    post: Post,
    manager: EntityManager,
    userId: string,
  ) {
    // ── Phase 1: Parse body and collect all targets (no DB calls yet) ──
    const wikilinkRegex = /\[\[(.*?)\]\]/g;
    let match;
    const postUuids: { uuid: string; alias: string | null }[] = [];
    const externalUrls: { url: string; title: string | null }[] = [];
    const topicSlugs: { slug: string; alias: string | null }[] = [];

    while ((match = wikilinkRegex.exec(post.body)) !== null) {
      const content = match[1];
      if (content.includes('](')) continue;
      const parts = content.split('|');
      const targetsRaw = parts[0];
      const alias = parts[1]?.trim() || null;
      const targetItems = targetsRaw.split(',').map((s) => s.trim());

      for (const target of targetItems) {
        if (target.includes(']')) continue;
        if (target.toLowerCase().startsWith('post:')) {
          const uuid = target.split(':')[1];
          if (this.isValidUUID(uuid)) postUuids.push({ uuid, alias });
        } else if (target.startsWith('http')) {
          externalUrls.push({ url: target, title: alias });
        } else {
          topicSlugs.push({ slug: target.trim(), alias });
        }
      }
    }

    // Parse markdown links
    const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let mdMatch;
    while ((mdMatch = markdownLinkRegex.exec(post.body)) !== null) {
      const a = (mdMatch[1] ?? '').trim();
      const b = (mdMatch[2] ?? '').trim();
      const urlStartsHttp = (s: string) => /^https?:\/\//i.test(s);
      if (urlStartsHttp(b)) externalUrls.push({ url: b, title: a || null });
      else if (urlStartsHttp(a))
        externalUrls.push({ url: a, title: b || null });
    }

    // Parse mentions
    const mentionRegex = /@(\w+)/g;
    let mentionMatch;
    const mentionedHandles = new Set<string>();
    while ((mentionMatch = mentionRegex.exec(post.body)) !== null) {
      mentionedHandles.add(mentionMatch[1]);
    }

    // ── Phase 2: Batch-load all referenced entities in parallel ──
    const uniquePostUuids = [...new Set(postUuids.map((p) => p.uuid))];
    const uniqueTopicSlugs = [...new Set(topicSlugs.map((t) => t.slug))];
    const uniqueHandles = [...mentionedHandles];

    const [existingPosts, existingTopics, mentionedUsers] = await Promise.all([
      uniquePostUuids.length > 0
        ? manager.find(Post, {
            where: uniquePostUuids.map((id) => ({ id })),
            select: ['id'],
          })
        : Promise.resolve([]),
      uniqueTopicSlugs.length > 0
        ? manager.find(Topic, {
            where: uniqueTopicSlugs.map((slug) => ({ slug })),
          })
        : Promise.resolve([]),
      uniqueHandles.length > 0
        ? manager.find(User, {
            where: uniqueHandles.map((handle) => ({ handle })),
            select: ['id', 'handle'],
          })
        : Promise.resolve([]),
    ]);

    const validPostIds = new Set(existingPosts.map((p) => p.id));
    const topicBySlug = new Map(existingTopics.map((t) => [t.slug, t]));
    const userByHandle = new Map(mentionedUsers.map((u) => [u.handle, u]));

    // ── Phase 3: Batch-save all edges, sources, topics, mentions ──
    const linkedPostIds = new Set<string>();
    const postEdgesToSave: Partial<PostEdge>[] = [];
    for (const { uuid, alias } of postUuids) {
      if (validPostIds.has(uuid) && !linkedPostIds.has(uuid)) {
        linkedPostIds.add(uuid);
        postEdgesToSave.push({
          fromPostId: post.id,
          toPostId: uuid,
          edgeType: EdgeType.LINK,
          anchorText: alias,
        });
      }
    }

    // Deduplicate external URLs
    const seenUrls = new Set<string>();
    const externalSourcesToSave: Partial<ExternalSource>[] = [];
    const archiveUrls: string[] = [];
    for (const { url, title } of externalUrls) {
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        externalSourcesToSave.push({ postId: post.id, url, title });
        archiveUrls.push(url);
      }
    }

    // Topics: create missing ones, then save PostTopic entries
    const addedTopicIds = new Set<string>();
    const postTopicsToSave: Partial<PostTopic>[] = [];
    const newTopicsToIndex: Topic[] = [];
    for (const { slug } of topicSlugs) {
      let topic = topicBySlug.get(slug);
      if (!topic) {
        // Create missing topic
        topic = manager.create(Topic, { slug, title: slug, createdBy: userId });
        topic = await manager.save(Topic, topic);
        topicBySlug.set(slug, topic);
        newTopicsToIndex.push(topic);
      }
      if (!addedTopicIds.has(topic.id)) {
        addedTopicIds.add(topic.id);
        postTopicsToSave.push({ postId: post.id, topicId: topic.id });
      }
    }

    // Mentions
    const mentionsToSave: Partial<Mention>[] = [];
    for (const handle of mentionedHandles) {
      const user = userByHandle.get(handle);
      if (user && user.id !== userId) {
        mentionsToSave.push({ postId: post.id, mentionedUserId: user.id });
      }
    }

    // ── Phase 4: Batch-insert all in parallel (much faster than sequential saves) ──
    await Promise.all([
      postEdgesToSave.length > 0
        ? manager.save(PostEdge, postEdgesToSave)
        : Promise.resolve(),
      externalSourcesToSave.length > 0
        ? manager.save(ExternalSource, externalSourcesToSave)
        : Promise.resolve(),
      postTopicsToSave.length > 0
        ? manager.save(PostTopic, postTopicsToSave)
        : Promise.resolve(),
      mentionsToSave.length > 0
        ? manager.save(Mention, mentionsToSave)
        : Promise.resolve(),
    ]);

    // Fire-and-forget: index new topics + archive.org saves
    for (const topic of newTopicsToIndex) {
      this.meilisearch
        .indexTopic(topic)
        .catch((err) => this.logger.error('Failed to index topic', err));
    }
    for (const url of archiveUrls) {
      fetch(`https://web.archive.org/save/${url}`).catch(() => {});
    }
  }

  /**
   * Re-run source extraction (wikilinks, markdown links, mentions) for one post.
   * Clears existing PostEdge, ExternalSource, PostTopic, Mention for this post then runs processPublishedPost.
   */
  async reExtractSourcesForPost(postId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, {
        where: { id: postId },
        select: ['id', 'body', 'authorId', 'deletedAt'],
      });
      if (!post || post.deletedAt != null) return;
      const userId = post.authorId ?? post.id;
      await manager.delete(PostEdge, { fromPostId: postId });
      await manager.delete(ExternalSource, { postId });
      await manager.delete(PostTopic, { postId });
      await manager.delete(Mention, { postId });
      await this.processPublishedPost(post, manager, userId);
    });
  }

  /**
   * Re-extract sources for all non-deleted posts. Use after fixing markdown/wikilink parsing.
   */
  async reExtractAllPostsSources(): Promise<{
    processed: number;
    errors: number;
  }> {
    const posts = await this.postRepo.find({
      where: { deletedAt: IsNull() },
      select: ['id'],
    });
    let processed = 0;
    let errors = 0;
    for (const p of posts) {
      try {
        await this.reExtractSourcesForPost(p.id);
        processed++;
        if (processed % 100 === 0)
          this.logger.log(`Re-extracted ${processed}/${posts.length} posts`);
      } catch (err) {
        errors++;
        this.logger.warn(
          `Re-extract failed for post ${p.id}: ${(err as Error).message}`,
        );
      }
    }
    return { processed, errors };
  }

  // ... helpers
  private slugify(text: string): string {
    return (
      text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        // Remove control characters, standard punctuation (except -), etc.
        // Allow Unicode letters (\p{L}) and numbers (\p{N})
        .replace(/[^\p{L}\p{N}-]+/gu, '')
        .replace(/--+/g, '-')
    );
  }

  private isValidUUID(uuid: string) {
    const regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }

  async findOne(id: string, viewerId?: string): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author'],
      withDeleted: true,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Deleted posts stay in graph for references; return stub so client can show "deleted on ..." placeholder
    if (post.deletedAt != null) {
      const stub = { ...post } as Post & { viewerCanSeeContent?: boolean };
      stub.body = '';
      stub.title = null;
      stub.headerImageKey = null;
      stub.headerImageBlurhash = null;
      stub.viewerCanSeeContent = false;
      return stub;
    }

    // Visibility: author's is_protected only. Public → show; protected → show only to self or followers.
    // Read is_protected with raw SQL so we never treat public as private (only explicit true = protected).
    // To verify in DB: SELECT u.id, u.handle, u.is_protected FROM users u JOIN posts p ON p.author_id = u.id WHERE p.id = '<post_id>';
    let authorProtected = false;
    if (post.authorId) {
      const rows = await this.dataSource.query<
        { is_protected: boolean | string }[]
      >(`SELECT is_protected FROM users WHERE id = $1`, [post.authorId]);
      const raw = (rows ?? [])[0]?.is_protected;
      authorProtected = raw === true || raw === 't';
    }

    if (authorProtected) {
      let hasAccess = false;
      if (viewerId) {
        if (post.authorId === viewerId) {
          hasAccess = true;
        } else {
          const isFollowing = await this.dataSource.query(
            `SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2`,
            [viewerId, post.authorId],
          );
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          hasAccess = isFollowing.length > 0;
        }
      }

      if (!hasAccess) {
        // Return Private Stub (only when DB says author is protected and viewer has no access)
        const stub = { ...post } as Post & { isPrivateStub?: boolean };
        stub.body = '';
        stub.title = null;
        stub.headerImageKey = null;
        stub.headerImageBlurhash = null;
        stub.isPrivateStub = true;
        return stub;
      }
    }

    return post;
  }

  /** Return id -> { title?, deletedAt? } for linked post display (e.g. [[post:id]]). Includes soft-deleted posts so clients can show "(deleted content)" when no alias. Keys normalized to lowercase. */
  async getTitlesForPostIds(
    ids: string[],
  ): Promise<
    Record<
      string,
      { title?: string; deletedAt?: string; isProtected?: boolean }
    >
  > {
    if (ids.length === 0) return {};
    const unique = Array.from(new Set(ids));
    const posts = await this.postRepo.find({
      where: unique.map((id) => ({ id })),
      select: ['id', 'title', 'deletedAt', 'authorId'],
      withDeleted: true,
    });
    const authorIds = [
      ...new Set(posts.map((p) => p.authorId).filter(Boolean)),
    ] as string[];
    // Read is_protected from DB (raw SQL); only explicit true = protected. Matches findOne.
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
        authorProtected.set(
          row.id,
          row.is_protected === true || row.is_protected === 't',
        );
      }
    }
    const out: Record<
      string,
      { title?: string; deletedAt?: string; isProtected?: boolean }
    > = {};
    for (const p of posts) {
      const key = (p.id ?? '').toLowerCase();
      if (key) {
        const prot = p.authorId
          ? authorProtected.get(p.authorId) === true
          : false;
        out[key] = {
          title: p.title ?? undefined,
          deletedAt:
            p.deletedAt != null
              ? new Date(p.deletedAt).toISOString()
              : undefined,
          isProtected: prot ? true : undefined,
        };
      }
    }
    return out;
  }

  /** Preview metadata for composer: post ids and topic slugs -> header/avatar/image keys for source circles. */
  async getSourcePreviews(
    postIds: string[],
    topicSlugs: string[],
  ): Promise<{
    posts: Array<{
      id: string;
      title?: string;
      headerImageKey?: string | null;
      authorAvatarKey?: string | null;
    }>;
    topics: Array<{ slug: string; title?: string; imageKey?: string | null }>;
  }> {
    const uniquePostIds = Array.from(new Set(postIds));
    const uniqueSlugs = Array.from(
      new Set(topicSlugs.map((s) => s.trim()).filter(Boolean)),
    );
    const posts =
      uniquePostIds.length > 0
        ? await this.postRepo.find({
            where: { id: In(uniquePostIds) },
            select: ['id', 'title', 'headerImageKey', 'authorId'],
          })
        : [];
    const authorIds = [
      ...new Set(posts.map((p) => p.authorId).filter(Boolean)),
    ];
    const authors =
      authorIds.length > 0
        ? await this.userRepo.find({
            where: { id: In(authorIds) },
            select: ['id', 'avatarKey'],
          })
        : [];
    const authorMap = new Map(authors.map((a) => [a.id, a.avatarKey ?? null]));
    const postList = posts.map((p) => ({
      id: p.id,
      title: p.title ?? undefined,
      headerImageKey: p.headerImageKey ?? null,
      authorAvatarKey: p.authorId ? (authorMap.get(p.authorId) ?? null) : null,
    }));

    if (uniqueSlugs.length === 0) {
      return { posts: postList, topics: [] };
    }
    const topicRepo = this.dataSource.getRepository(Topic);
    const topics = await topicRepo.find({
      where: { slug: In(uniqueSlugs) },
      select: ['id', 'slug', 'title'],
    });
    const foundTopicIds = topics.map((t) => t.id);
    type LatestRow = { topicId: string; postId: string };
    const latestRows: LatestRow[] =
      foundTopicIds.length > 0
        ? await this.dataSource
            .createQueryBuilder()
            .select('pt.topic_id', 'topicId')
            .addSelect('p.id', 'postId')
            .from(PostTopic, 'pt')
            .innerJoin(Post, 'p', 'p.id = pt.post_id AND p.deleted_at IS NULL')
            .where('pt.topic_id IN (:...topicIds)', { topicIds: foundTopicIds })
            .distinctOn(['pt.topic_id'])
            .orderBy('pt.topic_id')
            .addOrderBy('p.created_at', 'DESC')
            .getRawMany<LatestRow>()
            .catch(() => [])
        : [];
    const latestPostIds = [...new Set(latestRows.map((r) => r.postId))];
    const topicToImageKey = new Map<string, string | null>();
    if (latestPostIds.length > 0) {
      const latestPosts = await this.postRepo.find({
        where: { id: In(latestPostIds) },
        select: ['id', 'headerImageKey'],
      });
      const postIdToKey = new Map(
        latestPosts.map((p) => [p.id, p.headerImageKey ?? null]),
      );
      latestRows.forEach((r) => {
        if (!topicToImageKey.has(r.topicId))
          topicToImageKey.set(r.topicId, postIdToKey.get(r.postId) ?? null);
      });
    }
    const topicList = topics.map((t) => ({
      slug: t.slug,
      title: t.title ?? undefined,
      imageKey: topicToImageKey.get(t.id) ?? null,
    }));

    return { posts: postList, topics: topicList };
  }

  async softDelete(userId: string, postId: string): Promise<void> {
    const post = await this.postRepo.findOne({
      where: { id: postId, authorId: userId },
    });

    if (!post) {
      throw new Error('Post not found or unauthorized');
    }

    await this.postRepo.softDelete(postId);

    this.meilisearch
      .deletePost(postId)
      .catch((err) => console.error('Failed to delete from Meilisearch', err));
  }

  async createQuote(
    userId: string,
    quotedPostId: string,
    commentary: string,
  ): Promise<Post> {
    if (!commentary || commentary.trim().length === 0) {
      throw new Error('Commentary is required for quotes');
    }

    const quotedPost = await this.postRepo.findOne({
      where: { id: quotedPostId },
    });

    if (!quotedPost) {
      throw new Error('Quoted post not found');
    }

    const quoteBody = `${commentary}\n\n[[post:${quotedPostId}]]`;

    // Create post but skip queue until we add the edge
    const quotePost = await this.create(userId, { body: quoteBody }, true);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.manager.save(PostEdge, {
        fromPostId: quotePost.id,
        toPostId: quotedPostId,
        edgeType: EdgeType.QUOTE,
      });

      await this.postRepo.increment({ id: quotedPostId }, 'quoteCount', 1);
      if (quotedPost.authorId) {
        await this.userRepo.increment(
          { id: quotedPost.authorId },
          'quoteReceivedCount',
          1,
        );
      }
      // Re-index quoted post so search has fresh quoteCount
      const quotedUpdated = await this.postRepo.findOne({
        where: { id: quotedPostId },
        relations: ['author', 'postTopics'],
      });
      if (quotedUpdated) {
        const topicIds =
          quotedUpdated.postTopics?.map((pt) => pt.topicId) ?? [];
        this.meilisearch
          .indexPost({
            id: quotedUpdated.id,
            title: quotedUpdated.title,
            body: quotedUpdated.body,
            authorId: quotedUpdated.authorId || '',
            author: quotedUpdated.author
              ? {
                  displayName:
                    quotedUpdated.author.displayName ||
                    quotedUpdated.author.handle,
                  handle: quotedUpdated.author.handle,
                }
              : undefined,
            authorProtected: quotedUpdated.author?.isProtected,
            lang: quotedUpdated.lang,
            createdAt: quotedUpdated.createdAt,
            quoteCount: quotedUpdated.quoteCount,
            replyCount: quotedUpdated.replyCount,
            topicIds,
          })
          .catch((err) => console.error('Failed to re-index quoted post', err));
      }
    } finally {
      await queryRunner.release();
    }

    // Now queue it with consistent state
    await this.eventBus.publish('post-processing', 'process', {
      postId: quotePost.id,
      userId,
    });

    return quotePost;
  }

  async getSources(postId: string) {
    const [external, edges, mentions, topics] = await Promise.all([
      this.externalSourceRepo.find({ where: { postId }, take: 100 }),
      this.dataSource.getRepository(PostEdge).find({
        where: { fromPostId: postId, edgeType: EdgeType.LINK },
        relations: ['toPost', 'toPost.author'],
        take: 100,
      }),
      this.mentionRepo.find({
        where: { postId },
        relations: ['mentionedUser'],
        take: 100,
      }),
      this.dataSource.getRepository(PostTopic).find({
        where: { postId },
        relations: ['topic'],
        take: 100,
      }),
    ]);

    // Latest post header image per topic (for topic source circles)
    const topicIds = topics.map((t) => t.topicId);
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
            .distinctOn(['pt.topic_id'])
            .orderBy('pt.topic_id')
            .addOrderBy('p.created_at', 'DESC')
            .getRawMany<LatestRow>()
            .catch(() => [])
        : [];
    const latestPostIds = [...new Set(latestRows.map((r) => r.postId))];
    const topicToImageKey = new Map<string, string | null>();
    if (latestPostIds.length > 0) {
      const latestPosts = await this.postRepo.find({
        where: { id: In(latestPostIds) },
        select: ['id', 'headerImageKey'],
      });
      const postIdToKey = new Map(
        latestPosts.map((p) => [p.id, p.headerImageKey ?? null]),
      );
      latestRows.forEach((r) => {
        const key = postIdToKey.get(r.postId) ?? null;
        if (!topicToImageKey.has(r.topicId))
          topicToImageKey.set(r.topicId, key);
      });
    }

    // Deduplicate by canonical key so each source appears once (e.g. same user mentioned twice, same link twice)
    const externalByUrl = new Map<string, (typeof external)[0]>();
    for (const e of external) {
      if (e.url && !externalByUrl.has(e.url)) externalByUrl.set(e.url, e);
    }
    const edgesById = new Map<string, (typeof edges)[0]>();
    for (const e of edges) {
      if (e.toPostId && !edgesById.has(e.toPostId))
        edgesById.set(e.toPostId, e);
    }
    const mentionsById = new Map<string, (typeof mentions)[0]>();
    for (const m of mentions) {
      if (m.mentionedUserId && !mentionsById.has(m.mentionedUserId))
        mentionsById.set(m.mentionedUserId, m);
    }
    const topicsById = new Map<string, (typeof topics)[0]>();
    for (const t of topics) {
      if (t.topicId && !topicsById.has(t.topicId)) topicsById.set(t.topicId, t);
    }

    const results = [
      ...Array.from(externalByUrl.values()).map((e) => ({
        type: 'external',
        id: e.id,
        title: e.title,
        description: e.description ?? undefined,
        imageUrl: e.imageUrl ?? undefined,
        url: e.url,
        createdAt: e.createdAt,
      })),
      ...Array.from(edgesById.values()).map((e) => ({
        type: 'post',
        id: e.toPostId,
        title: e.toPost?.title || 'Post',
        anchor: e.anchorText,
        createdAt: e.createdAt,
        headerImageKey: e.toPost?.headerImageKey ?? null,
        authorAvatarKey: e.toPost?.author?.avatarKey ?? null,
      })),
      ...Array.from(mentionsById.values()).map((m) => ({
        type: 'user',
        id: m.mentionedUserId,
        handle: m.mentionedUser?.handle,
        title: m.mentionedUser?.displayName || m.mentionedUser?.handle,
        createdAt: m.createdAt,
        avatarKey: m.mentionedUser?.avatarKey ?? null,
      })),
      ...Array.from(topicsById.values()).map((t) => ({
        type: 'topic',
        id: t.topicId,
        slug: t.topic?.slug,
        title: t.topic?.title,
        createdAt: new Date(),
        imageKey: topicToImageKey.get(t.topicId) ?? null,
      })),
    ];

    return results;
  }

  async getReferencedBy(postId: string) {
    const edges = await this.dataSource.getRepository(PostEdge).find({
      where: [
        { toPostId: postId, edgeType: EdgeType.LINK },
        { toPostId: postId, edgeType: EdgeType.QUOTE },
      ],
      relations: ['fromPost', 'fromPost.author'],
      take: 20,
      order: { createdAt: 'DESC' },
    });

    return edges
      .filter((edge) => edge.fromPost && !edge.fromPost.deletedAt)
      .map((edge) => edge.fromPost)
      .filter((post): post is Post => post !== null);
  }

  /** Posts that quote this post (for "Quoted by" tab). */
  async getQuotes(postId: string) {
    const edges = await this.dataSource.getRepository(PostEdge).find({
      where: { toPostId: postId, edgeType: EdgeType.QUOTE },
      relations: ['fromPost', 'fromPost.author'],
      take: 50,
      order: { createdAt: 'DESC' },
    });
    return edges
      .filter((edge) => edge.fromPost && !edge.fromPost.deletedAt)
      .map((edge) => edge.fromPost)
      .filter((post): post is Post => post !== null);
  }

  async getGraph(postId: string) {
    // Try Neo4j first for efficient multi-hop graph traversal
    const neo4jGraph = await this.neo4jQuery.getPostGraph(postId);
    if (neo4jGraph && neo4jGraph.nodes.length > 1) {
      return { centerId: postId, ...neo4jGraph };
    }

    // Fallback: Postgres-based graph (multiple queries)
    // 1. Center Node
    const centerPost = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['author'],
      select: ['id', 'title', 'headerImageKey', 'authorId'],
    });
    if (!centerPost) throw new NotFoundException('Post not found');

    const nodes = new Map<string, any>();
    const edges: Array<{ source: string; target: string; type: string }> = [];

    const addNode = (id: string, type: string, data: any) => {
      if (!nodes.has(id)) {
        nodes.set(id, { id, type, ...data });
      }
    };

    // Add Center
    addNode(centerPost.id, 'post', {
      label: centerPost.title || 'Post',
      image: centerPost.headerImageKey,
      author: centerPost.author?.handle,
      isCenter: true,
    });

    // 2. L1 Outgoing (Sources)
    // We re-use getSources logic but optimized for graph (ids only mostly)
    const sources = await this.getSources(postId);
    const l1PostIds: string[] = [];

    type GraphSourceItem = {
      id: string;
      type: string;
      title?: string | null;
      handle?: string;
      slug?: string;
      headerImageKey?: string | null;
      avatarKey?: string | null;
      imageKey?: string | null;
      imageUrl?: string | null;
      url?: string;
    };
    for (const source of sources) {
      const s = source as GraphSourceItem;
      addNode(s.id, s.type, {
        label: s.title || s.handle || s.slug || 'Source',
        image: s.headerImageKey || s.avatarKey || s.imageKey || s.imageUrl,
        url: s.url, // for external
      });
      edges.push({ source: postId, target: s.id, type: 'cites' });
      if (s.type === 'post') l1PostIds.push(s.id);
    }

    // 3. L1 Incoming (Citations/Referenced By)
    // We limit to 20 to avoid explosion
    const incomingEdges = await this.dataSource.getRepository(PostEdge).find({
      where: [
        { toPostId: postId, edgeType: EdgeType.LINK },
        { toPostId: postId, edgeType: EdgeType.QUOTE },
      ],
      relations: ['fromPost', 'fromPost.author'],
      take: 20,
      order: { createdAt: 'DESC' },
    });

    for (const edge of incomingEdges) {
      if (!edge.fromPost || edge.fromPost.deletedAt) continue;
      const p = edge.fromPost;
      addNode(p.id, 'post', {
        label: p.title || 'Post',
        image: p.headerImageKey,
        author: p.author?.handle,
      });
      edges.push({
        source: p.id,
        target: postId,
        type: edge.edgeType.toLowerCase(),
      }); // 'link' or 'quote'
      l1PostIds.push(p.id);
    }

    // 3b. Co-Citations (Other posts linking to the same external URLs)
    const externalUrls = sources
      .filter((s: GraphSourceItem) => s.type === 'external' && s.url)
      .map((s: GraphSourceItem) => s.url);

    if (externalUrls.length > 0) {
      const coCitations = await this.externalSourceRepo
        .createQueryBuilder('source')
        .innerJoinAndSelect('source.post', 'post')
        .leftJoinAndSelect('post.author', 'author')
        .where('source.url IN (:...urls)', { urls: externalUrls })
        .andWhere('source.post_id != :postId', { postId })
        .andWhere('post.deleted_at IS NULL')
        .orderBy('post.created_at', 'DESC')
        .take(50)
        .getMany();

      const coCitesPerUrl = new Map<string, number>();

      for (const coCite of coCitations) {
        const post = coCite.post;
        if (!post) continue;
        const url = coCite.url;
        const currentCount = coCitesPerUrl.get(url) || 0;
        if (currentCount >= 3) continue; // Limit 3 other posts per URL
        coCitesPerUrl.set(url, currentCount + 1);

        addNode(post.id, 'post', {
          label: post.title || 'Post',
          image: post.headerImageKey,
          author: post.author?.handle,
          isL2: true, // Treat as L2 (indirect connection via URL)
        });

        edges.push({
          source: post.id,
          target: url,
          type: 'cites_url',
        });
      }
    }

    // 4. L2 Connections (Neighbors of L1 Posts)
    // We only look for *outgoing* from the L1 posts to show what *they* cite.
    // Showing what cites them might get too noisy.
    // We limit to 5 per L1 post to keep it readable.
    if (l1PostIds.length > 0) {
      const uniqueL1Ids = [...new Set(l1PostIds)];

      // Bulk fetch edges from these L1 posts
      // This might return many, so we use a window function or just fetch and filter in JS (easier for small N)
      // Actually, let's just fetch all edges from these posts, limited to e.g. 200 total
      const l2Edges = await this.dataSource
        .getRepository(PostEdge)
        .createQueryBuilder('edge')
        .leftJoinAndSelect('edge.toPost', 'toPost')
        .where('edge.fromPostId IN (:...ids)', { ids: uniqueL1Ids })
        .andWhere('edge.edgeType IN (:...types)', {
          types: [EdgeType.LINK, EdgeType.QUOTE],
        })
        .limit(200)
        .getMany();

      const edgesPerPost = new Map<string, number>();

      for (const edge of l2Edges) {
        if (!edge.toPost || edge.toPostId === postId) continue; // Don't point back to center (already handled)

        const currentCount = edgesPerPost.get(edge.fromPostId) || 0;
        if (currentCount >= 5) continue; // Limit 5 edges per L1 node

        edgesPerPost.set(edge.fromPostId, currentCount + 1);

        // Add L2 Node (lightweight)
        addNode(edge.toPostId, 'post', {
          label: edge.toPost.title || 'Post',
          isL2: true, // Marker for UI to render smaller
        });

        edges.push({
          source: edge.fromPostId,
          target: edge.toPostId,
          type: edge.edgeType.toLowerCase(),
        });
      }
    }

    return {
      centerId: postId,
      nodes: Array.from(nodes.values()),
      edges,
    };
  }
}
