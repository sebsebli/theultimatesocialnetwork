import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedService } from './feed.service';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getHomeFeed(
    @CurrentUser() user: { id: string },
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
    @Query('includeSavedBy') includeSavedBy?: string,
  ) {
    const includeSaved = includeSavedBy === 'true';
    return this.feedService.getHomeFeed(user.id, +limit, +offset, includeSaved);
  }
}