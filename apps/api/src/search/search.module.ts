import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { DmMessage } from '../entities/dm-message.entity';
import { DmThread } from '../entities/dm-thread.entity';
import { MeilisearchService } from './meilisearch.service';
import { SearchController } from './search.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Topic, User, PostTopic, DmMessage, DmThread]),
    UploadModule,
  ],
  controllers: [SearchController],
  providers: [MeilisearchService],
  exports: [MeilisearchService],
})
export class SearchModule {}
