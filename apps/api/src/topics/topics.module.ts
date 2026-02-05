import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { TopicFollowsService } from './topic-follows.service';
import { Topic } from '../entities/topic.entity';
import { TopicFollow } from '../entities/topic-follow.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { ExploreModule } from '../explore/explore.module';
import { SearchModule } from '../search/search.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    UploadModule,
    TypeOrmModule.forFeature([
      Topic,
      TopicFollow,
      PostTopic,
      Post,
      User,
      Follow,
      ExternalSource,
    ]),
    forwardRef(() => ExploreModule),
    SearchModule,
  ],
  controllers: [TopicsController],
  providers: [TopicsService, TopicFollowsService],
  exports: [TopicsService, TopicFollowsService],
})
export class TopicsModule {}
