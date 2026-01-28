import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { LanguageDetectionService } from './language-detection.service';
import { NotificationHelperService } from './notification-helper.service';
import { EmailService } from './email.service';
import { EmbeddingService } from './embedding.service';
import { Notification } from '../entities/notification.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { PushOutbox } from '../entities/push-outbox.entity';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification, Post, User, PushOutbox]),
    RealtimeModule,
  ],
  providers: [
    LanguageDetectionService,
    NotificationHelperService,
    EmailService,
    EmbeddingService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (!redisUrl) {
          throw new Error('REDIS_URL is not configured');
        }
        return new Redis(redisUrl);
      },
      inject: [ConfigService],
    },
    {
      provide: 'PUSH_QUEUE',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return new Queue('push-processing', { 
            connection: new Redis(redisUrl || 'redis://redis:6379', { maxRetriesPerRequest: null }) 
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    LanguageDetectionService,
    NotificationHelperService,
    EmailService,
    EmbeddingService,
    'REDIS_CLIENT',
    'PUSH_QUEUE',
  ],
})
export class SharedModule {}
