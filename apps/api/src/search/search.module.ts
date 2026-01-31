import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { DmMessage } from '../entities/dm-message.entity';
import { DmThread } from '../entities/dm-thread.entity';
import { MeilisearchService } from './meilisearch.service';
import { SearchController } from './search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Topic, User, DmMessage, DmThread])],
  controllers: [SearchController],
  providers: [MeilisearchService],
  exports: [MeilisearchService],
})
export class SearchModule {}
