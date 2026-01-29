import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { PostEdge } from '../entities/post-edge.entity';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';
import { Follow } from '../entities/follow.entity';
import { PostRead } from '../entities/post-read.entity';
import { Notification } from '../entities/notification.entity';
import { Collection } from '../entities/collection.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ExportWorker } from './export.worker';
import { Queue } from 'bullmq';

import { SharedModule } from '../shared/shared.module';
import { SearchModule } from '../search/search.module';
import { defaultQueueConfig } from '../common/queue-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Post,
      Reply,
      PostEdge,
      Like,
      Keep,
      Follow,
      PostRead,
      Notification,
      Collection,
    ]),
    ConfigModule,
    SharedModule,
    SearchModule,
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
