import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostWorker } from './post.worker';
import { Post } from '../entities/post.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { Mention } from '../entities/mention.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { DatabaseModule } from '../database/database.module';
import { SearchModule } from '../search/search.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SharedModule } from '../shared/shared.module';
import { SafetyModule } from '../safety/safety.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, ExternalSource, Mention, User, Follow]),
    ConfigModule,
    DatabaseModule,
    SearchModule,
    NotificationsModule,
    SharedModule,
    SafetyModule,
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostWorker,
    {
      provide: 'POST_QUEUE',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return new Queue('post-processing', { 
            connection: new Redis(redisUrl || 'redis://redis:6379', { maxRetriesPerRequest: null }) 
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [PostsService],
})
export class PostsModule {}
