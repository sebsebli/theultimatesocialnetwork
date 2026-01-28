import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MeilisearchService } from './meilisearch.service';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly meilisearch: MeilisearchService) {}

  @Get('posts')
  @UseGuards(AuthGuard('jwt'))
  async searchPosts(
    @CurrentUser() user: { id: string },
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('lang') lang?: string,
  ) {
    if (!query || query.trim().length === 0) {
      return { hits: [], estimatedTotalHits: 0 };
    }

    const results = await this.meilisearch.searchPosts(query, {
      limit,
      offset,
      lang,
    });

    return results;
  }

  @Get('users')
  @UseGuards(AuthGuard('jwt'))
  async searchUsers(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim().length === 0) {
      return { hits: [] };
    }
    return this.meilisearch.searchUsers(query, limit);
  }

  @Get('topics')
  @UseGuards(AuthGuard('jwt'))
  async searchTopics(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim().length === 0) {
      return { hits: [] };
    }
    // Assuming topics are indexed in Meilisearch 'topics' index
    // If not, this needs to be implemented in MeilisearchService
    return this.meilisearch.searchTopics(query, limit);
  }
}
