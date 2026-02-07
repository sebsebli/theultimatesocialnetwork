import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedFanoutService } from './feed-fanout.service';
import { Post } from '../entities/post.entity';
import { Follow } from '../entities/follow.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Collection } from '../entities/collection.entity';
import { User } from '../entities/user.entity';
import { Block } from '../entities/block.entity';
import { Mute } from '../entities/mute.entity';
import { TopicFollow } from '../entities/topic-follow.entity';
import { Topic } from '../entities/topic.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { PostEdge } from '../entities/post-edge.entity';
import { SharedModule } from '../shared/shared.module';
import { UploadModule } from '../upload/upload.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { ExploreModule } from '../explore/explore.module';

@Module({
  imports: [
    ExploreModule,
    TypeOrmModule.forFeature([
      Post,
      Follow,
      CollectionItem,
      Collection,
      User,
      Block,
      Mute,
      TopicFollow,
      Topic,
      PostTopic,
      PostEdge,
    ]),
    SharedModule,
    UploadModule,
    InteractionsModule,
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedFanoutService],
  exports: [FeedFanoutService],
})
export class FeedModule { }
