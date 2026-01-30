import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
  DefaultValuePipe,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedService } from './feed.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('feed')
export class FeedController {
  private readonly logger = new Logger(FeedController.name);

  constructor(
    private readonly feedService: FeedService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getHomeFeed(
    @CurrentUser() user: { id: string },
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('includeSavedBy') includeSavedBy?: string,
  ) {
    // Require completed onboarding (no placeholder profile) before allowing feed access
    const me = await this.userRepo.findOne({
      where: { id: user.id },
      select: ['id', 'handle', 'displayName', 'onboardingCompletedAt'],
    });
    const hasPlaceholder =
      !me ||
      (typeof me.handle === 'string' && me.handle.startsWith('__pending_'));
    if (hasPlaceholder) {
      throw new ForbiddenException('Complete onboarding first');
    }
    try {
      const includeSaved = includeSavedBy === 'true';
      return await this.feedService.getHomeFeed(
        user.id,
        limit,
        offset,
        includeSaved,
      );
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error(
        `Feed load failed for user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to load feed');
    }
  }
}
