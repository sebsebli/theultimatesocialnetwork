import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Inject,
} from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Follow } from '../entities/follow.entity';
import { NotificationType } from '../entities/notification.entity';
import { Neo4jService } from '../database/neo4j.service';
import { MeilisearchService } from '../search/meilisearch.service';
import { EmbeddingService } from '../shared/embedding.service';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { EdgeType } from '../entities/post-edge.entity';
import { workerJobCounter, workerJobDuration } from '../common/metrics';
import { SafetyService } from '../safety/safety.service';

interface PostJobData {
  postId: string;
  userId: string;
}

@Injectable()
export class PostWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(PostWorker.name);
  private worker: Worker;

  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    private configService: ConfigService,
    private neo4jService: Neo4jService,
    private meilisearchService: MeilisearchService,
    private embeddingService: EmbeddingService,
    private notificationHelper: NotificationHelperService,
    private safetyService: SafetyService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  onApplicationBootstrap() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    this.worker = new Worker<PostJobData>(
      'post-processing',
      async (job: Job<PostJobData>) => {
        this.logger.log(`Processing post ${job.data.postId}`);
        await this.processPost(job.data.postId, job.data.userId);
      },
      {
        connection: new Redis(redisUrl || 'redis://redis:6379', {
          maxRetriesPerRequest: null,
        }),
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
  }

  onApplicationShutdown() {
    this.worker.close().catch((err: Error) => {
      console.error('Error closing worker', err);
    });
  }

  async processPost(postId: string, userId: string) {
    const end = workerJobDuration.startTimer({ worker: 'post' });
    try {
      const post = await this.postRepo.findOne({
        where: { id: postId },
        relations: [
          'author',
          'outgoingEdges',
          'postTopics',
          'postTopics.topic',
          'mentions',
          'mentions.mentionedUser',
        ],
      });

      if (!post) {
        this.logger.warn(`Post ${postId} not found, skipping processing.`);
        end();
        workerJobCounter.inc({ worker: 'post', status: 'skipped' });
        return;
      }

      // 0. Async Moderation (Full Stage 2 Check)
      const safety = await this.safetyService.checkContent(
        post.body,
        userId,
        'post',
      );
      if (!safety.safe) {
        this.logger.warn(
          `Post ${postId} failed async moderation: ${safety.reason}`,
        );
        await this.postRepo.softDelete(postId);
        end();
        workerJobCounter.inc({ worker: 'post', status: 'moderated' });
        return;
      }

      // 1. Embedding & Search Indexing
      const embeddingText = `${post.title || ''} ${post.body}`.trim();
      const embedding =
        await this.embeddingService.generateEmbedding(embeddingText);

      await this.meilisearchService.indexPost({
        id: post.id,
        title: post.title,
        body: post.body,
        authorId: post.authorId,
        author: {
          displayName: post.author.displayName || post.author.handle,
          handle: post.author.handle,
        },
        lang: post.lang,
        createdAt: post.createdAt,
        quoteCount: post.quoteCount,
        replyCount: post.replyCount,
        embedding: embedding || undefined,
      });

      // 2. Neo4j Sync
      await this.neo4jService.run(
        `
            MERGE (u:User {id: $userId})
            MERGE (p:Post {id: $postId})
            SET p.createdAt = $createdAt
            MERGE (u)-[:AUTHORED]->(p)
            `,
        { userId, postId: post.id, createdAt: post.createdAt.toISOString() },
      );

      // Topics
      if (post.postTopics?.length) {
        for (const pt of post.postTopics) {
          await this.neo4jService.run(
            `
                    MATCH (p:Post {id: $postId})
                    MERGE (t:Topic {slug: $slug})
                    ON CREATE SET t.title = $title
                    MERGE (p)-[:IN_TOPIC]->(t)
                    `,
            { postId: post.id, slug: pt.topic.slug, title: pt.topic.title },
          );
        }
      }

      // Edges
      if (post.outgoingEdges?.length) {
        for (const edge of post.outgoingEdges) {
          if (edge.edgeType === EdgeType.LINK) {
            await this.neo4jService.run(
              `
                        MATCH (p1:Post {id: $fromId})
                        MERGE (p2:Post {id: $toId})
                        MERGE (p1)-[:LINKS_TO]->(p2)
                        `,
              { fromId: post.id, toId: edge.toPostId },
            );
          } else if (edge.edgeType === EdgeType.QUOTE) {
            await this.neo4jService.run(
              `
                        MATCH (p1:Post {id: $fromId})
                        MATCH (p2:Post {id: $toId})
                        MERGE (p1)-[:QUOTES]->(p2)
                        `,
              { fromId: post.id, toId: edge.toPostId },
            );

            const quotedPost = await this.postRepo.findOne({
              where: { id: edge.toPostId },
            });
            if (quotedPost && quotedPost.authorId !== userId) {
              await this.notificationHelper.createNotification({
                userId: quotedPost.authorId,
                type: NotificationType.QUOTE,
                actorUserId: userId,
                postId: quotedPost.id,
              });
            }
          }
        }
      }

      // Mentions
      if (post.mentions?.length) {
        for (const mention of post.mentions) {
          if (mention.mentionedUserId !== userId) {
            await this.neo4jService.run(
              `
                        MATCH (p:Post {id: $postId})
                        MERGE (u:User {id: $userId})
                        MERGE (p)-[:MENTIONS]->(u)
                        `,
              { postId: post.id, userId: mention.mentionedUserId },
            );

            await this.notificationHelper.createNotification({
              userId: mention.mentionedUserId,
              type: NotificationType.MENTION,
              actorUserId: userId,
              postId: post.id,
            });
          }
        }
      }

      // 3. Feed Fan-out
      const BATCH_SIZE = 1000;
      let page = 0;
      let followers: Follow[];

      do {
        followers = await this.followRepo.find({
          where: { followeeId: userId },
          select: ['followerId'],
          take: BATCH_SIZE,
          skip: page * BATCH_SIZE,
        });

        if (followers.length > 0) {
          const pipeline = this.redis.pipeline();
          for (const follow of followers) {
            const key = `feed:${follow.followerId}`;
            pipeline.lpush(key, post.id);
            pipeline.ltrim(key, 0, 500); // Keep top 500
          }
          await pipeline.exec();
        }
        page++;
      } while (followers.length === BATCH_SIZE);

      workerJobCounter.inc({ worker: 'post', status: 'success' });
      end();
    } catch (e) {
      this.logger.error(`Error processing post ${postId}`, e);
      workerJobCounter.inc({ worker: 'post', status: 'failed' });
      end();
      throw e; // Retry
    }
  }
}
