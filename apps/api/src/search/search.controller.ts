import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { MeilisearchService } from './meilisearch.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('search')
export class SearchController {
  constructor(
    private readonly meilisearch: MeilisearchService,
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
  ) {}

  @Get('posts')
  @UseGuards(OptionalJwtAuthGuard)
  async searchPosts(
    @CurrentUser() _user: { id: string } | null,
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('lang') lang?: string,
    @Query('topicSlug') topicSlug?: string,
  ) {
    if (!query || query.trim().length === 0) {
      return { hits: [], estimatedTotalHits: 0 };
    }
    let topicId: string | undefined;
    if (topicSlug?.trim()) {
      const topic = await this.topicRepo.findOne({
        where: { slug: topicSlug.trim() },
        select: ['id'],
      });
      topicId = topic?.id;
      if (!topicId) return { hits: [], estimatedTotalHits: 0 };
    }
    const results = await this.meilisearch.searchPosts(query, {
      limit,
      offset,
      lang,
      topicId,
    });
    return results;
  }

  @Get('users')
  @UseGuards(OptionalJwtAuthGuard)
  async searchUsers(
    @CurrentUser() _user: { id: string } | null,
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim().length === 0) {
      return { hits: [], estimatedTotalHits: 0 };
    }
    return this.meilisearch.searchUsers(query, limit);
  }

  @Get('all')
  @UseGuards(OptionalJwtAuthGuard)
  async searchAll(
    @CurrentUser() _user: { id: string } | null,
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim().length === 0) {
      return { posts: [], users: [], topics: [] };
    }
    return this.meilisearch.searchAll(query, limit);
  }

  @Get('topics')
  @UseGuards(OptionalJwtAuthGuard)
  async searchTopics(
    @CurrentUser() _user: { id: string } | null,
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim().length === 0) {
      return { hits: [] };
    }
    return this.meilisearch.searchTopics(query, limit);
  }
}
