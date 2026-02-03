import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { AccountDeletionRequest } from '../entities/account-deletion-request.entity';
import { EmailChangeRequest } from '../entities/email-change-request.entity';
import { DataExport } from '../entities/data-export.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { PostEdge } from '../entities/post-edge.entity';
import { Like } from '../entities/like.entity';
import { ReplyLike } from '../entities/reply-like.entity';
import { Keep } from '../entities/keep.entity';
import { Follow } from '../entities/follow.entity';
import { FollowRequest } from '../entities/follow-request.entity';
import { PostRead } from '../entities/post-read.entity';
import { Notification } from '../entities/notification.entity';
import { NotificationPref } from '../entities/notification-pref.entity';
import { Collection } from '../entities/collection.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ExportWorker } from './export.worker';
import { Queue } from 'bullmq';

import { SharedModule } from '../shared/shared.module';
import { SearchModule } from '../search/search.module';
import { UploadModule } from '../upload/upload.module';
import { CollectionsModule } from '../collections/collections.module';
import { SafetyModule } from '../safety/safety.module';
import { TopicsModule } from '../topics/topics.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { defaultQueueConfig } from '../common/queue-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AccountDeletionRequest,
      EmailChangeRequest,
      DataExport,
      Post,
      Reply,
      PostEdge,
      Like,
      ReplyLike,
      Keep,
      Follow,
      FollowRequest,
      PostRead,
      Notification,
      NotificationPref,
      Collection,
    ]),
    ConfigModule,
    SharedModule,
    SearchModule,
    UploadModule,
    CollectionsModule,
    SafetyModule,
    TopicsModule,
    InteractionsModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    ExportWorker,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return new Redis(redisUrl || 'redis://redis:6379');
      },
      inject: [ConfigService],
    },
    {
      provide: 'EXPORT_QUEUE',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return new Queue('data-export', {
          connection: new Redis(redisUrl || 'redis://redis:6379', {
            maxRetriesPerRequest: null,
          }),
          ...defaultQueueConfig,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
