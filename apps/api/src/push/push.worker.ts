import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown, Inject } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushOutbox, PushStatus } from '../entities/push-outbox.entity';
import { PushToken } from '../entities/push-token.entity';

@Injectable()
export class PushWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(PushWorker.name);
  private worker: Worker;

  constructor(
    @InjectRepository(PushOutbox) private pushOutboxRepo: Repository<PushOutbox>,
    @InjectRepository(PushToken) private pushTokenRepo: Repository<PushToken>,
    private configService: ConfigService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  onApplicationBootstrap() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    this.worker = new Worker('push-processing', async (job: Job) => {
      await this.processPush(job.data.id);
    }, { 
        connection: new Redis(redisUrl || 'redis://redis:6379', { maxRetriesPerRequest: null }) 
    });
    
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const outbox = await this.pushOutboxRepo.findOne({ where: { id: outboxId } } as any);
      if (!outbox) return;

      if (outbox.status === PushStatus.SENT) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tokens = await this.pushTokenRepo.find({ where: { userId: outbox.userId, disabledAt: null } as any });
      
      if (tokens.length === 0) {
          outbox.status = PushStatus.SUPPRESSED;
          outbox.lastError = 'No active tokens';
          await this.pushOutboxRepo.save(outbox);
          return;
      }

      // Simulate Send (Placeholder for APNs/FCM logic)
      // In a real implementation, we would inject ApnsSender / FcmSender here.
      for (const token of tokens) {
          this.logger.log(`[Mock Send] Provider: ${token.provider}, Token: ${token.token.substring(0, 10)}..., Title: ${outbox.title}`);
          // if (failed) invalidTokens.push(token);
      }

      outbox.status = PushStatus.SENT;
      outbox.sentAt = new Date();
      outbox.attemptCount += 1;
      await this.pushOutboxRepo.save(outbox);
  }
}