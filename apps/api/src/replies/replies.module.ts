import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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
  providers: [RepliesService, ReplyWorker],
  exports: [RepliesService],
})
export class RepliesModule { }
