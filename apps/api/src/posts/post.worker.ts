import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { NotificationType } from '../entities/notification.entity';
import { FeedFanoutService } from '../feed/feed-fanout.service';
import { MetadataService } from '../metadata/metadata.service';
import { Neo4jService } from '../database/neo4j.service';
import { MeilisearchService } from '../search/meilisearch.service';
import { EmbeddingService } from '../shared/embedding.service';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { EdgeType } from '../entities/post-edge.entity';
import { workerJobCounter, workerJobDuration } from '../common/metrics';
import { SafetyService } from '../safety/safety.service';
import {
  ModerationReasonCode,
  ModerationSource,
  ModerationTargetType,
} from '../entities/moderation-record.entity';
import { IEventBus, EVENT_BUS } from '../common/event-bus/event-bus.interface';
import Redis from 'ioredis';

interface PostJobData {
  postId: string;
  userId: string;
}

@Injectable()
export class PostWorker implements OnApplicationBootstrap {
  private readonly logger = new Logger(PostWorker.name);

  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(ExternalSource)
    private externalSourceRepo: Repository<ExternalSource>,
    private feedFanout: FeedFanoutService,
    private neo4jService: Neo4jService,
    private meilisearchService: MeilisearchService,
    private embeddingService: EmbeddingService,
    private notificationHelper: NotificationHelperService,
    private safetyService: SafetyService,
    private metadataService: MetadataService,
    @Inject('REDIS_CLIENT') private redis: Redis,
    @Inject(EVENT_BUS) private eventBus: IEventBus,
  ) {}

  async onApplicationBootstrap() {
    await this.eventBus.subscribe<PostJobData>(
      'post-processing',
      async (_event, data) => {
        this.logger.log(`Processing post ${data.postId}`);
        await this.processPost(data.postId, data.userId);
      },
      { concurrency: 5 },
    );
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

      if (!post.authorId) {
        this.logger.log(
          `Post ${postId} has no author (anonymized), skipping processing.`,
        );
        end();
        return;
      }

      // Skip async moderation for agent users (email @agents.local). Agent API skips sync check;
      // if we ran moderation here we would soft-delete agent-created posts on false positives.
      const authorEmail =
        (post.author as { email?: string } | null)?.email ?? '';
      const isAgentUser =
        typeof authorEmail === 'string' &&
        authorEmail.toLowerCase().endsWith('@agents.local');

      if (!isAgentUser) {
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
          await this.safetyService
            .recordModeration({
              targetType: ModerationTargetType.POST,
              targetId: postId,
              authorId: userId,
              reasonCode: safety.reasonCode ?? ModerationReasonCode.OTHER,
              reasonText: safety.reason ?? 'Content moderated',
              confidence: safety.confidence ?? 0.5,
              contentSnapshot: post.body,
              source: ModerationSource.ASYNC_CHECK,
            })
            .catch(() => {});
          await this.postRepo.softDelete(postId);
          end();
          workerJobCounter.inc({ worker: 'post', status: 'moderated' });
          return;
        }
      }

      // 1. Embedding & Search Indexing
      const embeddingText = `${post.title || ''} ${post.body}`.trim();
      const embedding =
        await this.embeddingService.generateEmbedding(embeddingText);

      const topicIds = post.postTopics?.map((pt) => pt.topicId) ?? [];
      await this.meilisearchService.indexPost({
        id: post.id,
        title: post.title,
        body: post.body,
        authorId: post.authorId,
        author: post.author
          ? {
              displayName: post.author.displayName || post.author.handle,
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
        embedding: embedding || undefined,
      });

      // 2. Neo4j Sync (optional — skipped when Neo4j is not configured)
      try {
        await this.neo4jService.run(
          `
              MERGE (u:User {id: $userId})
              MERGE (p:Post {id: $postId})
              SET p.createdAt = $createdAt, p.readingTime = $readingTime
              MERGE (u)-[:AUTHORED]->(p)
              `,
          {
            userId,
            postId: post.id,
            createdAt: post.createdAt.toISOString(),
            readingTime: post.readingTimeMinutes,
          },
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

        // Mentions (Neo4j sync only)
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
            }
          }
        }

        // External sources: connect Post -> ExternalUrl in graph
        const externalSources = await this.externalSourceRepo.find({
          where: { postId },
          select: ['url', 'title'],
        });
        for (const source of externalSources) {
          if (!source.url?.trim()) continue;
          await this.neo4jService.run(
            `
              MATCH (p:Post {id: $postId})
              MERGE (u:ExternalUrl {url: $url})
              ON CREATE SET u.title = $title
              ON MATCH SET u.title = CASE WHEN $title IS NOT NULL AND $title <> '' THEN $title ELSE u.title END
              MERGE (p)-[:CITES_EXTERNAL]->(u)
              `,
            {
              postId: post.id,
              url: source.url.trim(),
              title: source.title?.trim() ?? null,
            },
          );
        }
      } catch (e) {
        this.logger.warn(
          `Neo4j sync failed for post ${postId} (non-fatal): ${(e as Error).message}`,
        );
      }

      // 2b. Edges — notifications (always needed) + Neo4j sync (optional)
      if (post.outgoingEdges?.length) {
        for (const edge of post.outgoingEdges) {
          if (edge.edgeType === EdgeType.LINK) {
            try {
              await this.neo4jService.run(
                `
                          MATCH (p1:Post {id: $fromId})
                          MERGE (p2:Post {id: $toId})
                          MERGE (p1)-[:LINKS_TO]->(p2)
                          `,
                { fromId: post.id, toId: edge.toPostId },
              );
            } catch (e) {
              this.logger.warn(
                `Neo4j LINKS_TO sync failed (non-fatal): ${(e as Error).message}`,
              );
            }
          } else if (edge.edgeType === EdgeType.QUOTE) {
            try {
              await this.neo4jService.run(
                `
                          MATCH (p1:Post {id: $fromId})
                          MATCH (p2:Post {id: $toId})
                          MERGE (p1)-[:QUOTES]->(p2)
                          `,
                { fromId: post.id, toId: edge.toPostId },
              );
            } catch (e) {
              this.logger.warn(
                `Neo4j QUOTES sync failed (non-fatal): ${(e as Error).message}`,
              );
            }

            const quotedPost = await this.postRepo.findOne({
              where: { id: edge.toPostId },
            });
            if (
              quotedPost &&
              quotedPost.authorId &&
              quotedPost.authorId !== userId
            ) {
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

      // 2c. Mention notifications (always needed, independent of Neo4j)
      if (post.mentions?.length) {
        for (const mention of post.mentions) {
          if (mention.mentionedUserId !== userId) {
            await this.notificationHelper.createNotification({
              userId: mention.mentionedUserId,
              type: NotificationType.MENTION,
              actorUserId: userId,
              postId: post.id,
            });
          }
        }
      }

      // 3. Feed Fan-out (hybrid push/pull via FeedFanoutService)
      const fanoutCount = await this.feedFanout.fanOutPost(post.id, userId);
      if (fanoutCount > 0) {
        this.logger.debug(`Feed fanout: pushed to ${fanoutCount} followers.`);
      }

      // 4. Fetch URL metadata for external sources missing title or description
      const allSources = await this.externalSourceRepo.find({
        where: { postId },
        select: ['id', 'url', 'title', 'description'],
      });
      const toEnrich = allSources.filter(
        (s) => s.title == null || s.description == null,
      );
      for (const source of toEnrich) {
        try {
          const og = await this.metadataService.getOpenGraph(source.url);
          const updates: Partial<{
            title: string | null;
            description: string | null;
            imageUrl: string | null;
          }> = {};
          // Prefer existing title (e.g. user's link text); fill from OG only when missing
          if (
            (source.title == null || source.title.trim() === '') &&
            og.title?.trim()
          )
            updates.title = og.title.trim();
          if (og.description != null && og.description !== '')
            updates.description = og.description;
          if (og.image != null && og.image !== '') updates.imageUrl = og.image;
          if (Object.keys(updates).length > 0) {
            await this.externalSourceRepo.update(source.id, updates);
          }
        } catch (e) {
          this.logger.debug(
            `Failed to fetch metadata for ${source.url}: ${(e as Error).message}`,
          );
        }
      }

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
