import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedService } from './feed.service';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('feed')
export class FeedController {
  private readonly logger = new Logger(FeedController.name);

  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getHomeFeed(
    @CurrentUser() user: { id: string },
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('offset', ParseIntPipe) offset: number = 0,
    @Query('includeSavedBy') includeSavedBy?: string,
  ) {
    try {
      const includeSaved = includeSavedBy === 'true';
      return await this.feedService.getHomeFeed(
        user.id,
        limit,
        offset,
        includeSaved,
      );
    } catch (error) {
      this.logger.error(
        `Feed load failed for user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to load feed');
    }
  }
}
