import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostWorker } from './post.worker';
import { Post } from '../entities/post.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { Mention } from '../entities/mention.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { DatabaseModule } from '../database/database.module';
import { FeedModule } from '../feed/feed.module';
import { SearchModule } from '../search/search.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SharedModule } from '../shared/shared.module';
import { SafetyModule } from '../safety/safety.module';
import { UploadModule } from '../upload/upload.module';
import { MetadataModule } from '../metadata/metadata.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { ExploreModule } from '../explore/explore.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, ExternalSource, Mention, User, Follow]),
    ConfigModule,
    DatabaseModule,
    FeedModule,
    SearchModule,
    NotificationsModule,
    SharedModule,
    SafetyModule,
    UploadModule,
    MetadataModule,
    InteractionsModule,
    ExploreModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostWorker],
  exports: [PostsService],
})
export class PostsModule {}
