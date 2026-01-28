import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
        visibility: dto.visibility,
        lang: lang,
        langConfidence: confidence,
        readingTimeMinutes: readingTime,
      });

      // Explicitly save as single entity
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      savedPost = await queryRunner.manager.save(Post, post);

      // 4. Extract & Process Wikilinks [[target|alias]]
      const wikilinkRegex = /\[\[(.*?)\]\]/g;
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
              // Index topic (async, lightweight)
              this.meilisearch
                .indexTopic(topic)
                .catch((err) => console.error('Failed to index topic', err));
            }
            await queryRunner.manager.save(PostTopic, {
              postId: savedPost.id,
              topicId: topic.id,
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
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // Offload side effects to background queue
    if (!skipQueue) {
      await this.postQueue.add('process', { postId: savedPost.id, userId });
    }

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
      .replace(/--+/g, '-');
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

    if (post.visibility === PostVisibility.PUBLIC) {
      return post;
    }

    if (!viewerId) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId === viewerId) {
      return post;
    }

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
    const quotePost = await this.create(
      userId,
      {
        body: quoteBody,
        visibility: PostVisibility.PUBLIC,
      },
      true,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.manager.save(PostEdge, {
        fromPostId: quotePost.id,
        toPostId: quotedPostId,
        edgeType: EdgeType.QUOTE,
      });

      await this.postRepo.increment({ id: quotedPostId }, 'quoteCount', 1);
    } finally {
      await queryRunner.release();
    }

    // Now queue it with consistent state
    await this.postQueue.add('process', { postId: quotePost.id, userId });

    return quotePost;
  }

  async getSources(postId: string) {
    return this.externalSourceRepo.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });
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
}
