import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepliesController } from './replies.controller';
import { RepliesService } from './replies.service';
import { Reply } from '../entities/reply.entity';
import { Post } from '../entities/post.entity';
import { Mention } from '../entities/mention.entity';
import { User } from '../entities/user.entity';
import { SharedModule } from '../shared/shared.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SafetyModule } from '../safety/safety.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reply, Post, Mention, User]),
    DatabaseModule,
    NotificationsModule,
    SafetyModule,
    SharedModule,
  ],
  controllers: [RepliesController],
  providers: [RepliesService],
  exports: [RepliesService],
})
export class RepliesModule {}
