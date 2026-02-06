import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PushOutbox, PushStatus } from '../entities/push-outbox.entity';
import { PushToken, PushProvider } from '../entities/push-token.entity';
import { ApnsSender } from './senders/apns.sender';
import { FcmSender } from './senders/fcm.sender';
import { IEventBus, EVENT_BUS } from '../common/event-bus/event-bus.interface';
import Redis from 'ioredis';
import { decryptField } from '../shared/field-encryption';

@Injectable()
export class PushWorker implements OnApplicationBootstrap {
  private readonly logger = new Logger(PushWorker.name);

  constructor(
    @InjectRepository(PushOutbox)
    private pushOutboxRepo: Repository<PushOutbox>,
    @InjectRepository(PushToken) private pushTokenRepo: Repository<PushToken>,
    private apnsSender: ApnsSender,
    private fcmSender: FcmSender,
    @Inject('REDIS_CLIENT') private redis: Redis,
    @Inject(EVENT_BUS) private eventBus: IEventBus,
  ) {}

  async onApplicationBootstrap() {
    await this.eventBus.subscribe<{ id: string }>(
      'push-processing',
      async (_event, data) => {
        await this.processPush(data.id);
      },
      { concurrency: 5 },
    );
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
        // Decrypt token before sending (may be encrypted at rest)
        const rawToken = decryptField(token.token);

        if (token.provider === PushProvider.APNS) {
          result = await this.apnsSender.send({
            deviceToken: rawToken,
            title: outbox.title,
            body: outbox.body,
            data: dataPayload,
            environment:
              token.apnsEnvironment === 'production' ? 'production' : 'sandbox',
          });
        } else {
          result = await this.fcmSender.send({
            token: rawToken,
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
