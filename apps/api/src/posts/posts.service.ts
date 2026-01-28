import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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

@Injectable()
export class PostsService {
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
  ) {}

  async create(userId: string, dto: CreatePostDto): Promise<Post> {
    // Sanitize HTML in body (preserve markdown, remove dangerous HTML)
    // This prevents XSS while allowing markdown syntax
    // Dynamic import to handle ESM in CJS environment
    const { default: DOMPurify } = await import('isomorphic-dompurify');
    const sanitizedBody = DOMPurify.sanitize(dto.body, {
      ALLOWED_TAGS: [], // No HTML tags allowed in markdown posts
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true, // Keep text content, remove tags
    });

    // AI Safety Check (Two-stage: Bayesian → Gemma)
    const safety = await this.safetyService.checkContent(
      sanitizedBody,
      userId,
      'post',
    );
    if (!safety.safe) {
      throw new BadRequestException(
        safety.reason || 'Content flagged by safety check',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedPost: Post;
    const neo4jCommands: Array<() => Promise<void>> = [];

    try {
      // 1. Parse Title
      const titleMatch = sanitizedBody.match(/^#\s+(.+)$/m);
      const title = titleMatch
        ? DOMPurify.sanitize(titleMatch[1].trim(), { ALLOWED_TAGS: [] })
        : null;

      // 2. Detect Language (with user profile fallback)
      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: ['languages'],
      });
      const { lang, confidence } = await this.languageDetection.detectLanguage(
        sanitizedBody,
        userId,
        user?.languages || [],
      );

      // Reading Time (Words / 200)
      const wordCount = sanitizedBody.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      // 3. Create Post
      const post = this.postRepo.create({
        authorId: userId,
        body: sanitizedBody,
        title: title,
        headerImageKey: dto.headerImageKey,
        headerImageBlurhash: dto.headerImageBlurhash,
        visibility: dto.visibility,
        lang: lang,
        langConfidence: confidence,
        readingTimeMinutes: readingTime,
      });

      // Explicitly save as single entity
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      savedPost = (await queryRunner.manager.save(Post, post)) as Post;

      // Queue Neo4j User -> Post
      neo4jCommands.push(async () => {
        await this.neo4jService.run(
          `
          MERGE (u:User {id: $userId})
          CREATE (p:Post {id: $postId, createdAt: $createdAt})
          MERGE (u)-[:AUTHORED]->(p)
          `,
          {
            userId,
            postId: savedPost.id,
            createdAt: savedPost.createdAt.toISOString(),
          },
        );
      });

      // 4. Extract & Process Wikilinks [[target|alias]]
      const wikilinkRegex = /\\\[\[(.*?)\]\]/g;
      let match;
      while ((match = wikilinkRegex.exec(sanitizedBody)) !== null) {
        const content = match[1];
        const parts = content.split('|');
        const targetsRaw = parts[0];
        const alias = parts[1]?.trim() || null;

        const targetItems = targetsRaw.split(',').map((s) => s.trim());

        for (const target of targetItems) {
          if (target.toLowerCase().startsWith('post:')) {
            const targetUuid = target.split(':')[1];
            if (this.isValidUUID(targetUuid)) {
              // Check if target post exists
              const targetPost = await queryRunner.manager.findOne(Post, {
                where: { id: targetUuid },
              });
              if (targetPost) {
                await queryRunner.manager.save(PostEdge, {
                  fromPostId: savedPost.id,
                  toPostId: targetUuid,
                  edgeType: EdgeType.LINK,
                  anchorText: alias,
                });

                // Neo4j Link
                neo4jCommands.push(async () => {
                  await this.neo4jService.run(
                    `
                    MATCH (p1:Post {id: $fromId})
                    MERGE (p2:Post {id: $toId})
                    MERGE (p1)-[:LINKS_TO]->(p2)
                    `,
                    { fromId: savedPost.id, toId: targetUuid },
                  );
                });
              }
            }
          } else if (target.startsWith('http')) {
            await queryRunner.manager.save(ExternalSource, {
              postId: savedPost.id,
              url: target,
              title: alias,
            });
            fetch(`https://web.archive.org/save/${target}`).catch(() => {});
          } else {
            // Topic Link
            const slug = this.slugify(target);
            let topic = await queryRunner.manager.findOne(Topic, {
              where: { slug },
            });
            if (!topic) {
              topic = queryRunner.manager.create(Topic, {
                slug,
                title: target,
                createdBy: userId,
              });
              topic = await queryRunner.manager.save(Topic, topic);

              // Index topic
              this.meilisearch
                .indexTopic(topic)
                .catch((err) => console.error('Failed to index topic', err));
            }
            await queryRunner.manager.save(PostTopic, {
              postId: savedPost.id,
              topicId: topic.id,
            });

            // Neo4j Topic
            neo4jCommands.push(async () => {
              await this.neo4jService.run(
                `
                MATCH (p:Post {id: $postId})
                MERGE (t:Topic {slug: $slug})
                ON CREATE SET t.title = $title
                MERGE (p)-[:IN_TOPIC]->(t)
                `,
                {
                  postId: savedPost.id,
                  slug: topic!.slug,
                  title: topic!.title,
                },
              );
            });
          }
        }
      }

      // 5. Extract & Process Mentions @handle
      const mentionRegex = /@(\w+)/g;
      let mentionMatch;
      const mentionedHandles = new Set<string>();
      while ((mentionMatch = mentionRegex.exec(sanitizedBody)) !== null) {
        mentionedHandles.add(mentionMatch[1]);
      }

      for (const handle of mentionedHandles) {
        const mentionedUser = await queryRunner.manager.findOne(User, {
          where: { handle },
        });
        if (mentionedUser && mentionedUser.id !== userId) {
          await queryRunner.manager.save(Mention, {
            postId: savedPost.id,
            mentionedUserId: mentionedUser.id,
          });

          // Create notification
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          await this.notificationHelper.createNotification({
            userId: mentionedUser.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: 'MENTION' as any,
            actorUserId: userId,
            postId: savedPost.id,
          });

          // Neo4j Mention
          neo4jCommands.push(async () => {
            await this.neo4jService.run(
              `
              MATCH (p:Post {id: $postId})
              MERGE (u:User {id: $userId})
              MERGE (p)-[:MENTIONS]->(u)
              `,
              { postId: savedPost.id, userId: mentionedUser.id },
            );
          });
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // Execute Neo4j commands AFTER Postgres commit (best effort)
    // In prod, this should be a proper job queue (BullMQ)
    void Promise.allSettled(neo4jCommands.map((cmd) => cmd())).then(() => {
      // Log errors
    });

    // Generate Embedding & Index in Meilisearch (async, best effort)
    const author = await this.postRepo.manager.findOne(User, {
      where: { id: savedPost.authorId },
    });

    const embeddingText = `${savedPost.title || ''} ${savedPost.body}`.trim();
    this.embeddingService.generateEmbedding(embeddingText).then((vector) => {
      this.meilisearch
        .indexPost({
          id: savedPost.id,
          title: savedPost.title,
          body: savedPost.body,
          authorId: savedPost.authorId,
          author:
            author
              ? {
                  displayName: author.displayName || author.handle,
                  handle: author.handle,
                }
              : undefined,
          lang: savedPost.lang,
          createdAt: savedPost.createdAt,
          quoteCount: savedPost.quoteCount,
          replyCount: savedPost.replyCount,
          embedding: vector || undefined,
        })
        .catch((err) => console.error('Meilisearch indexing error', err));
    }).catch((err) => console.error('Embedding generation error', err));

    return savedPost;
  }

  // ... helpers
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
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
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Visibility Check
    if (post.visibility === PostVisibility.PUBLIC) {
      return post;
    }

    // If protected, viewer must be authenticated
    if (!viewerId) {
      // Mimic "not found" for unauthorized users (security best practice)
      throw new NotFoundException('Post not found');
    }

    // Author can always see their own post
    if (post.authorId === viewerId) {
      return post;
    }

    // If FOLLOWERS only, check if viewer follows author
    if (post.visibility === PostVisibility.FOLLOWERS) {
      const isFollowing = await this.dataSource.query(
        `SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2`,
        [viewerId, post.authorId],
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (isFollowing.length > 0) {
        return post;
      }
    }

    throw new NotFoundException('Post not found');
  }

  async softDelete(userId: string, postId: string): Promise<void> {
    const post = await this.postRepo.findOne({
      where: { id: postId, authorId: userId },
    });

    if (!post) {
      throw new Error('Post not found or unauthorized');
    }

    await this.postRepo.softDelete(postId);

    // Remove from search index
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

    // Get the quoted post
    const quotedPost = await this.postRepo.findOne({
      where: { id: quotedPostId },
    });

    if (!quotedPost) {
      throw new Error('Quoted post not found');
    }

    // Create quote post with reference
    const quoteBody = `${commentary}\n\n[[post:${quotedPostId}]]`;

    const quotePost = await this.create(userId, {
      body: quoteBody,
      visibility: PostVisibility.PUBLIC,
    });

    // Create QUOTE edge
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.manager.save(PostEdge, {
        fromPostId: quotePost.id,
        toPostId: quotedPostId,
        edgeType: EdgeType.QUOTE,
      });

      // Increment quote count on quoted post
      await this.postRepo.increment({ id: quotedPostId }, 'quoteCount', 1);

      // Notify quoted post author
      if (quotedPost.authorId !== userId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        await this.notificationHelper.createNotification({
          userId: quotedPost.authorId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: 'QUOTE' as any,
          actorUserId: userId,
          postId: quotedPostId,
        });
      }

      // Neo4j update
      await this.neo4jService.run(
        `
        MATCH (p1:Post {id: $fromId})
        MATCH (p2:Post {id: $toId})
        MERGE (p1)-[:QUOTES]->(p2)
        `,
        { fromId: quotePost.id, toId: quotedPostId },
      );
    } finally {
      await queryRunner.release();
    }

    return quotePost;
  }

  async getSources(postId: string) {
    return this.externalSourceRepo.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });
  }

  async getReferencedBy(postId: string) {
    // Find posts that LINK_TO or QUOTE this post
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
}