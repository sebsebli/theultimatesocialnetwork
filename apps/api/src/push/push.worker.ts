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
import { IsNull, Repository } from 'typeorm';
import { PushOutbox, PushStatus } from '../entities/push-outbox.entity';
import { PushToken, PushProvider } from '../entities/push-token.entity';
import { ApnsSender } from './senders/apns.sender';
import { FcmSender } from './senders/fcm.sender';

@Injectable()
export class PushWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(PushWorker.name);
  private worker: Worker;

  constructor(
    @InjectRepository(PushOutbox)
    private pushOutboxRepo: Repository<PushOutbox>,
    @InjectRepository(PushToken) private pushTokenRepo: Repository<PushToken>,
    private configService: ConfigService,
    private apnsSender: ApnsSender,
    private fcmSender: FcmSender,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  onApplicationBootstrap() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    this.worker = new Worker(
      'push-processing',
      async (job: Job) => {
        const data = job.data as { id: string };
        await this.processPush(data.id);
      },
      {
        connection: new Redis(redisUrl || 'redis://redis:6379', {
          maxRetriesPerRequest: null,
        }),
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Push Job ${job?.id} failed: ${err.message}`);
    });
  }

  onApplicationShutdown() {
    this.worker.close().catch((err: Error) => {
      console.error('Error closing worker', err);
    });
  }

  async processPush(outboxId: string) {
    const outbox = await this.pushOutboxRepo.findOne({
      where: { id: outboxId },
    });
    if (!outbox) return;

    if (outbox.status === PushStatus.SENT) return;

    const tokens = await this.pushTokenRepo.find({
      where: { userId: outbox.userId, disabledAt: IsNull() },
    });

    if (tokens.length === 0) {
      outbox.status = PushStatus.SUPPRESSED;
      outbox.lastError = 'No active tokens';
      await this.pushOutboxRepo.save(outbox);
      return;
    }

    const dataPayload = outbox.data as Record<string, string>;
    let successCount = 0;

    for (const token of tokens) {
      let result: { ok: boolean; invalidToken?: boolean; error?: string };

      try {
        if (token.provider === PushProvider.APNS) {
          result = await this.apnsSender.send({
            deviceToken: token.token,
            title: outbox.title,
            body: outbox.body,
            data: dataPayload,
            environment:
              token.apnsEnvironment === 'production' ? 'production' : 'sandbox',
          });
        } else {
          result = await this.fcmSender.send({
            token: token.token,
            title: outbox.title,
            body: outbox.body,
            data: dataPayload,
          });
        }

        if (result.ok) {
          successCount++;
        } else {
          this.logger.warn(
            `Push failed for token ${token.id}: ${result.error}`,
          );
          if (result.invalidToken) {
            token.disabledAt = new Date();
            await this.pushTokenRepo.save(token);
          }
        }
      } catch (err) {
        this.logger.error(`Error sending to token ${token.id}`, err);
      }
    }

    if (successCount > 0) {
      outbox.status = PushStatus.SENT;
    } else {
      outbox.status = PushStatus.FAILED;
      outbox.lastError = 'All tokens failed';
    }

    outbox.sentAt = new Date();
    outbox.attemptCount += 1;
    await this.pushOutboxRepo.save(outbox);
  }
}
