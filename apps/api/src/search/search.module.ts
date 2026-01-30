import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from '../entities/topic.entity';
import { MeilisearchService } from './meilisearch.service';
import { SearchController } from './search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Topic])],
  controllers: [SearchController],
  providers: [MeilisearchService],
  exports: [MeilisearchService],
})
export class SearchModule {}
