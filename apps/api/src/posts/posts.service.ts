/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Queue } from 'bullmq';
import { Post, PostVisibility } from '../entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostEdge, EdgeType } from '../entities/post-edge.entity';
import { Topic } from '../entities/topic.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { User } from '../entities/user.entity';
import { Mention } from '../entities/mention.entity';
import { Neo4jService } from '../database/neo4j.service';
import { LanguageDetectionService } from '../shared/language-detection.service';
import { MeilisearchService } from '../search/meilisearch.service';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { SafetyService } from '../safety/safety.service';
import { EmbeddingService } from '../shared/embedding.service';

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
    private languageDetection: LanguageDetectionService,
    private meilisearch: MeilisearchService,
    private notificationHelper: NotificationHelperService,
    private safetyService: SafetyService,
    private embeddingService: EmbeddingService,
    @Inject('POST_QUEUE') private postQueue: Queue,
  ) {}

  async create(
    userId: string,
    dto: CreatePostDto,
    skipQueue = false,
  ): Promise<Post> {
    // Sanitize HTML in body
    const { default: DOMPurify } = await import('isomorphic-dompurify');
    const sanitizedBody = DOMPurify.sanitize(dto.body, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });

    // AI Safety Check (Fast Stage 1 only)
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
      await this.postQueue.add('process', { postId: savedPost.id, userId });
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
            author: { id: true, handle: true, displayName: true },
          },
        })
        .then((post) => {
          if (!post) return;
          const topicIds = post.postTopics?.map((pt) => pt.topicId) ?? [];
          return this.meilisearch.indexPost({
            id: post.id,
            title: post.title,
            body: post.body,
            authorId: post.authorId,
            author: post.author
              ? {
                  displayName: post.author.displayName ?? post.author.handle,
                  handle: post.author.handle,
                }
              : undefined,
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
        await this.postQueue.add('process', { postId: savedPost.id, userId });
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
              author: { id: true, handle: true, displayName: true },
            },
          })
          .then((post) => {
            if (!post) return;
            const topicIds = post.postTopics?.map((pt) => pt.topicId) ?? [];
            return this.meilisearch.indexPost({
              id: post.id,
              title: post.title,
              body: post.body,
              authorId: post.authorId,
              author: post.author
                ? {
                    displayName: post.author.displayName ?? post.author.handle,
                    handle: post.author.handle,
                  }
                : undefined,
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

  private async processPublishedPost(
    post: Post,
    manager: EntityManager,
    userId: string,
  ) {
    // 4. Extract & Process Wikilinks [[target|alias]]
    const wikilinkRegex = /\[\[(.*?)\]\]/g;
    let match;
    while ((match = wikilinkRegex.exec(post.body)) !== null) {
      const content = match[1];
      const parts = content.split('|');
      const targetsRaw = parts[0];
      const alias = parts[1]?.trim() || null;

      const targetItems = targetsRaw.split(',').map((s) => s.trim());

      for (const target of targetItems) {
        if (target.toLowerCase().startsWith('post:')) {
          const targetUuid = target.split(':')[1];
          if (this.isValidUUID(targetUuid)) {
            const targetPost = await manager.findOne(Post, {
              where: { id: targetUuid },
            });
            if (targetPost) {
              await manager.save(PostEdge, {
                fromPostId: post.id,
                toPostId: targetUuid,
                edgeType: EdgeType.LINK,
                anchorText: alias,
              });
            }
          }
        } else if (target.startsWith('http')) {
          await manager.save(ExternalSource, {
            postId: post.id,
            url: target,
            title: alias,
          });
          fetch(`https://web.archive.org/save/${target}`).catch(() => {});
        } else {
          // Topic Link
          const slug = target.trim();
          let topic = await manager.findOne(Topic, {
            where: { slug },
          });
          if (!topic) {
            topic = manager.create(Topic, {
              slug,
              title: slug,
              createdBy: userId,
            });
            topic = await manager.save(Topic, topic);
            // Index topic (async, lightweight)
            this.meilisearch
              .indexTopic(topic)
              .catch((err) => this.logger.error('Failed to index topic', err));
          }
          await manager.save(PostTopic, {
            postId: post.id,
            topicId: topic.id,
          });
        }
      }
    }

    // 4b. Extract markdown links [text](url) and save as ExternalSource if not already present
    const existingExternal = await manager.find(ExternalSource, {
      where: { postId: post.id },
      select: ['url'],
    });
    const existingUrls = new Set(existingExternal.map((e) => e.url));
    const markdownLinkRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
    let mdMatch;
    while ((mdMatch = markdownLinkRegex.exec(post.body)) !== null) {
      const url = mdMatch[2];
      const linkText = mdMatch[1].trim() || null;
      if (!existingUrls.has(url)) {
        await manager.save(ExternalSource, {
          postId: post.id,
          url,
          title: linkText,
        });
        existingUrls.add(url);
        fetch(`https://web.archive.org/save/${url}`).catch(() => {});
      }
    }

    // 5. Extract & Process Mentions @handle
    const mentionRegex = /@(\w+)/g;
    let mentionMatch;
    const mentionedHandles = new Set<string>();
    while ((mentionMatch = mentionRegex.exec(post.body)) !== null) {
      mentionedHandles.add(mentionMatch[1]);
    }

    for (const handle of mentionedHandles) {
      const mentionedUser = await manager.findOne(User, {
        where: { handle },
      });
      if (mentionedUser && mentionedUser.id !== userId) {
        await manager.save(Mention, {
          postId: post.id,
          mentionedUserId: mentionedUser.id,
        });
      }
    }
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

    // Visibility is from the author's profile only: public profile → all posts visible; protected profile → only followers (and self)
    const authorProtected =
      (post.author as User | undefined)?.isProtected === true;
    if (!authorProtected) return post;

    if (!viewerId) throw new NotFoundException('Post not found');
    if (post.authorId === viewerId) return post;

    const isFollowing = await this.dataSource.query(
      `SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2`,
      [viewerId, post.authorId],
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (isFollowing.length > 0) return post;
    throw new NotFoundException('Post not found');
  }

  /** Return id -> { title?, deletedAt? } for linked post display (e.g. [[post:id]]). Includes soft-deleted posts so clients can show "(deleted content)" when no alias. Keys normalized to lowercase. */
  async getTitlesForPostIds(
    ids: string[],
  ): Promise<Record<string, { title?: string; deletedAt?: string }>> {
    if (ids.length === 0) return {};
    const unique = Array.from(new Set(ids));
    const posts = await this.postRepo.find({
      where: unique.map((id) => ({ id })),
      select: ['id', 'title', 'deletedAt'],
      withDeleted: true,
    });
    const out: Record<string, { title?: string; deletedAt?: string }> = {};
    for (const p of posts) {
      const key = (p.id ?? '').toLowerCase();
      if (key) {
        out[key] = {
          title: p.title ?? undefined,
          deletedAt:
            p.deletedAt != null
              ? new Date(p.deletedAt).toISOString()
              : undefined,
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
      authorAvatarKey: authorMap.get(p.authorId) ?? null,
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
            authorId: quotedUpdated.authorId,
            author: quotedUpdated.author
              ? {
                  displayName:
                    quotedUpdated.author.displayName ||
                    quotedUpdated.author.handle,
                  handle: quotedUpdated.author.handle,
                }
              : undefined,
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
    await this.postQueue.add('process', { postId: quotePost.id, userId });

    return quotePost;
  }

  async getSources(postId: string) {
    const [external, edges, mentions, topics] = await Promise.all([
      this.externalSourceRepo.find({ where: { postId } }),
      this.dataSource.getRepository(PostEdge).find({
        where: { fromPostId: postId, edgeType: EdgeType.LINK },
        relations: ['toPost', 'toPost.author'],
      }),
      this.mentionRepo.find({
        where: { postId },
        relations: ['mentionedUser'],
      }),
      this.dataSource.getRepository(PostTopic).find({
        where: { postId },
        relations: ['topic'],
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
}
