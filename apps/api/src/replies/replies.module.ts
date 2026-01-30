import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { RepliesController } from './replies.controller';
import { RepliesService } from './replies.service';
import { ReplyWorker } from './reply.worker';
import { Reply } from '../entities/reply.entity';
import { ReplyLike } from '../entities/reply-like.entity';
import { Post } from '../entities/post.entity';
import { Mention } from '../entities/mention.entity';
import { User } from '../entities/user.entity';
import { SharedModule } from '../shared/shared.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SafetyModule } from '../safety/safety.module';
import { SearchModule } from '../search/search.module';
import { defaultQueueConfig } from '../common/queue-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reply, ReplyLike, Post, Mention, User]),
    ConfigModule,
    DatabaseModule,
    NotificationsModule,
    SafetyModule,
    SearchModule,
    SharedModule,
  ],
  controllers: [RepliesController],
  providers: [
    RepliesService,
    ReplyWorker,
    {
      provide: 'REPLY_QUEUE',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return new Queue('reply-processing', {
          connection: new Redis(redisUrl || 'redis://redis:6379', {
            maxRetriesPerRequest: null,
          }),
          ...defaultQueueConfig,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [RepliesService],
})
export class RepliesModule {}
