import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('lang') lang?: string,
  ) {
    if (!query || query.trim().length === 0) {
      return { hits: [], estimatedTotalHits: 0 };
    }

    const results = await this.meilisearch.searchPosts(query, {
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
      lang,
    });

    return results;
  }

  @Get('users')
  @UseGuards(AuthGuard('jwt'))
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    if (!query || query.trim().length === 0) {
      return { hits: [] };
    }
    return this.meilisearch.searchUsers(query, limit ? parseInt(limit, 10) : 10);
  }
}
