import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from '../entities/post.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { Mention } from '../entities/mention.entity';
import { User } from '../entities/user.entity';
import { DatabaseModule } from '../database/database.module';
import { SearchModule } from '../search/search.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SharedModule } from '../shared/shared.module';
import { SafetyModule } from '../safety/safety.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, ExternalSource, Mention, User]),
    DatabaseModule,
    SearchModule,
    NotificationsModule,
    SharedModule,
    SafetyModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
