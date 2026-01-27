import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LanguageDetectionService } from './language-detection.service';
import { NotificationHelperService } from './notification-helper.service';
import { EmailService } from './email.service';
import { Notification } from '../entities/notification.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification, Post, User]),
    RealtimeModule,
  ],
  providers: [
    LanguageDetectionService,
    NotificationHelperService,
    EmailService,
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
  ],
  exports: [
    LanguageDetectionService,
    NotificationHelperService,
    EmailService,
    'REDIS_CLIENT',
  ],
})
export class SharedModule {}
