import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PushOutbox, PushStatus } from '../entities/push-outbox.entity';
import { PushToken } from '../entities/push-token.entity';
import { ApnsSender } from './senders/apns.sender';
import { FcmSender } from './senders/fcm.sender';

@Injectable()
export class PushWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(PushWorker.name);
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(PushOutbox) private outboxRepo: Repository<PushOutbox>,
    @InjectRepository(PushToken) private tokenRepo: Repository<PushToken>,
    private apnsSender: ApnsSender,
    private fcmSender: FcmSender,
  ) {}

  onApplicationBootstrap() {
    this.start();
  }

  onApplicationShutdown() {
    this.stop();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log('Push worker started');
    // Poll every 5 seconds
    this.intervalId = setInterval(() => this.processOutbox(), 5000);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async processOutbox() {
    try {
      // Fetch pending items
      const pendingItems = await this.outboxRepo.find({
        where: { status: PushStatus.PENDING },
        take: 50, // Batch size
        order: { priority: 'DESC', createdAt: 'ASC' },
      });

      if (pendingItems.length === 0) return;

      this.logger.debug(`Processing ${pendingItems.length} push items`);

      for (const item of pendingItems) {
        await this.processItem(item);
      }
    } catch (error) {
      this.logger.error('Error processing push outbox', error);
    }
  }

  private async processItem(item: PushOutbox) {
    try {
      // Get active tokens for user
      const tokens = await this.tokenRepo.find({
        where: { userId: item.userId, disabledAt: IsNull() },
      });

      if (tokens.length === 0) {
        // No tokens, mark as sent (or suppressed)
        item.status = PushStatus.SENT; // or SUPPRESSED
        item.sentAt = new Date();
        await this.outboxRepo.save(item);
        return;
      }

      const results = await Promise.all(
        tokens.map((token) => this.sendToToken(token, item)),
      );

      // Check if all failed
      const allFailed = results.every((r) => !r.ok);
      if (allFailed) {
        item.status = PushStatus.FAILED;
        item.lastError = results.map((r) => r.error).join('; ');
      } else {
        item.status = PushStatus.SENT;
        item.sentAt = new Date();
      }
      
      item.attemptCount++;
      await this.outboxRepo.save(item);

    } catch (error: any) {
      this.logger.error(`Failed to process item ${item.id}`, error);
      item.status = PushStatus.FAILED;
      item.lastError = error.message;
      item.attemptCount++;
      await this.outboxRepo.save(item);
    }
  }

  private async sendToToken(token: PushToken, item: PushOutbox) {
    let result: { ok: boolean; invalidToken?: boolean; error?: string };

    if (token.provider === 'APNS') {
      result = await this.apnsSender.send({
        deviceToken: token.token,
        title: item.title,
        body: item.body,
        data: item.data as any,
        environment: token.apnsEnvironment as 'sandbox' | 'production' || 'production',
      });
    } else {
      result = await this.fcmSender.send({
        token: token.token,
        title: item.title,
        body: item.body,
        data: item.data as any,
      });
    }

    if (result.invalidToken) {
      this.logger.warn(`Invalid token for user ${token.userId}, disabling...`);
      token.disabledAt = new Date();
      await this.tokenRepo.save(token);
    }

    return result;
  }
}
