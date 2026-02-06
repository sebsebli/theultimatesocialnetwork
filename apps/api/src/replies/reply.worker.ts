import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reply } from '../entities/reply.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Mention } from '../entities/mention.entity';
import { NotificationType } from '../entities/notification.entity';
import { Neo4jService } from '../database/neo4j.service';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { SafetyService } from '../safety/safety.service';
import { workerJobCounter, workerJobDuration } from '../common/metrics';
import {
  ModerationReasonCode,
  ModerationSource,
  ModerationTargetType,
} from '../entities/moderation-record.entity';
import { IEventBus, EVENT_BUS } from '../common/event-bus/event-bus.interface';
import Redis from 'ioredis';
import { decryptField } from '../shared/field-encryption';

interface ReplyJobData {
  replyId: string;
  userId: string;
  postId: string;
}

@Injectable()
export class ReplyWorker implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReplyWorker.name);

  constructor(
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Mention) private mentionRepo: Repository<Mention>,
    private neo4jService: Neo4jService,
    private notificationHelper: NotificationHelperService,
    private safetyService: SafetyService,
    @Inject('REDIS_CLIENT') private redis: Redis,
    @Inject(EVENT_BUS) private eventBus: IEventBus,
  ) {}

  async onApplicationBootstrap() {
    await this.eventBus.subscribe<ReplyJobData>(
      'reply-processing',
      async (_event, data) => {
        await this.processReply(data);
      },
      { concurrency: 5 },
    );
  }

  async processReply(data: ReplyJobData) {
    const end = workerJobDuration.startTimer({ worker: 'reply' });
    const { replyId, userId, postId } = data;

    try {
      const reply = await this.replyRepo.findOne({ where: { id: replyId } });
      if (!reply) {
        end();
        workerJobCounter.inc({ worker: 'reply', status: 'skipped' });
        return;
      }

      // Skip async moderation for agent users (@agents.local); same as post.worker.
      const author = await this.userRepo.findOne({
        where: { id: userId },
        select: ['email'],
      });
      const rawAuthorEmail = author?.email ?? '';
      const authorEmail = rawAuthorEmail ? decryptField(rawAuthorEmail) : '';
      const isAgentUser =
        typeof authorEmail === 'string' &&
        authorEmail.toLowerCase().endsWith('@agents.local');

      if (!isAgentUser) {
        // 1. Async Moderation (Full)
        const safety = await this.safetyService.checkContent(
          reply.body,
          userId,
          'reply',
        );
        if (!safety.safe) {
          await this.safetyService
            .recordModeration({
              targetType: ModerationTargetType.REPLY,
              targetId: replyId,
              authorId: userId,
              reasonCode: safety.reasonCode ?? ModerationReasonCode.OTHER,
              reasonText: safety.reason ?? 'Content moderated',
              confidence: safety.confidence ?? 0.5,
              contentSnapshot: reply.body,
              source: ModerationSource.ASYNC_CHECK,
            })
            .catch(() => {});
          await this.replyRepo.softDelete(replyId);
          await this.postRepo.decrement({ id: postId }, 'replyCount', 1);
          this.logger.warn(
            `Reply ${replyId} soft-deleted by moderation: ${safety.reason}`,
          );
          end();
          workerJobCounter.inc({ worker: 'reply', status: 'moderated' });
          return;
        }
      }

      // 2. Neo4j Sync (optional — skipped when Neo4j is not configured)
      try {
        await this.neo4jService.run(
          `
                MATCH (p:Post {id: $postId})
                MERGE (u:User {id: $userId})
                CREATE (r:Reply {id: $replyId, createdAt: $createdAt})
                MERGE (u)-[:AUTHORED]->(r)
                MERGE (r)-[:REPLIED_TO]->(p)
                `,
          { userId, postId, replyId, createdAt: reply.createdAt.toISOString() },
        );
      } catch (e) {
        this.logger.warn(
          `Neo4j reply sync failed (non-fatal): ${(e as Error).message}`,
        );
      }

      // 3. Notifications (Post Author)
      const post = await this.postRepo.findOne({ where: { id: postId } });
      if (post && post.authorId && post.authorId !== userId) {
        await this.notificationHelper.createNotification({
          userId: post.authorId,
          type: NotificationType.REPLY,
          actorUserId: userId,
          postId: postId,
          replyId: replyId,
        });
      }

      // 4. Mentions (Notify + optional Neo4j sync)
      const mentions = await this.mentionRepo.find({ where: { replyId } });
      for (const mention of mentions) {
        if (mention.mentionedUserId !== userId) {
          // Neo4j Mention Sync (optional)
          try {
            await this.neo4jService.run(
              `
                        MATCH (r:Reply {id: $replyId})
                        MERGE (u:User {id: $userId})
                        MERGE (r)-[:MENTIONS]->(u)
                        `,
              { replyId, userId: mention.mentionedUserId },
            );
          } catch (e) {
            this.logger.warn(
              `Neo4j mention sync failed (non-fatal): ${(e as Error).message}`,
            );
          }

          await this.notificationHelper.createNotification({
            userId: mention.mentionedUserId,
            type: NotificationType.MENTION,
            actorUserId: userId,
            postId: postId,
            replyId: replyId,
          });
        }
      }

      workerJobCounter.inc({ worker: 'reply', status: 'success' });
      end();
    } catch (e) {
      this.logger.error(`Error processing reply ${replyId}`, e);
      workerJobCounter.inc({ worker: 'reply', status: 'failed' });
      end();
      throw e;
    }
  }
}
