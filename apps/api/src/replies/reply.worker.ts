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

interface ReplyJobData {
  replyId: string;
  userId: string;
  postId: string;
}

@Injectable()
export class ReplyWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(ReplyWorker.name);
  private worker: Worker;

  constructor(
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Mention) private mentionRepo: Repository<Mention>,
    private configService: ConfigService,
    private neo4jService: Neo4jService,
    private notificationHelper: NotificationHelperService,
    private safetyService: SafetyService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  onApplicationBootstrap() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    this.worker = new Worker<ReplyJobData>(
      'reply-processing',
      async (job: Job<ReplyJobData>) => {
        await this.processReply(job.data);
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

      // 2. Neo4j Sync
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

      // 4. Mentions (Notify)
      const mentions = await this.mentionRepo.find({ where: { replyId } });
      for (const mention of mentions) {
        if (mention.mentionedUserId !== userId) {
          // Neo4j Mention Sync (Reply mentions User)
          await this.neo4jService.run(
            `
                      MATCH (r:Reply {id: $replyId})
                      MERGE (u:User {id: $userId})
                      MERGE (r)-[:MENTIONS]->(u)
                      `,
            { replyId, userId: mention.mentionedUserId },
          );

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
