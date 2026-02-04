import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ExploreService } from './explore.service';
import { RecommendationService } from './recommendation.service';
import { UploadService } from '../upload/upload.service';
import { userToPlain } from '../shared/post-serializer';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../shared/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('explore')
export class ExploreController {
  constructor(
    private readonly exploreService: ExploreService,
    private readonly recommendationService: RecommendationService,
    private readonly uploadService: UploadService,
  ) {}

  /** Map User[] to plain objects with avatarKey and avatarUrl so clients always get profile pictures. */
  private withAvatar(list: User[]): Record<string, unknown>[] {
    return list.map((u) => {
      const plain = userToPlain(u) as Record<string, unknown>;
      if (!plain) return {} as Record<string, unknown>;
      const avatarKey = u.avatarKey ?? null;
      const avatarUrl = avatarKey
        ? this.uploadService.getImageUrl(avatarKey)
        : null;
      return { ...plain, avatarKey: avatarKey ?? undefined, avatarUrl };
    });
  }

  @Get('topics')
  @UseGuards(OptionalJwtAuthGuard)
  async getTopics(
    @CurrentUser() user?: { id: string },
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.exploreService.getTopics(user?.id, { sort, page, limit });
  }

  @Get('people')
  @UseGuards(OptionalJwtAuthGuard)
  async getPeople(
    @CurrentUser() user?: { id: string },
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const limitNum = limit ? Math.min(50, parseInt(limit, 10) || 20) : 20;
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    if (user?.id && (!sort || sort === 'recommended') && pageNum === 1) {
      try {
        const list = await this.recommendationService.getRecommendedPeople(
          user.id,
          limitNum + 1,
        );
        const hasMore = list.length > limitNum;
        const items = this.withAvatar(list.slice(0, limitNum));
        return { items, hasMore };
      } catch (err) {
        console.error('explore/people recommended error', err);
      }
    }
    const result = await this.exploreService.getPeople(user?.id, {
      sort,
      page: pageNum,
      limit: limitNum,
    });
    const items = this.withAvatar(result.items);
    return { items, hasMore: result.hasMore };
  }

  @Get('quoted-now')
  @UseGuards(OptionalJwtAuthGuard)
  async getQuotedNow(
    @CurrentUser() user?: { id: string },
    @Query('lang') lang?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? Math.min(50, parseInt(limit, 10) || 20) : 20;
    return this.exploreService.getQuotedNow(user?.id, limitNum, {
      lang,
      sort,
      page,
      limit,
    });
  }

  @Get('trending')
  @UseGuards(OptionalJwtAuthGuard)
  async getTrending(
    @CurrentUser() user?: { id: string },
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const posts = await this.exploreService.getTrending(user?.id, limitNum);
    return { items: posts };
  }

  @Get('deep-dives')
  @UseGuards(OptionalJwtAuthGuard)
  async getDeepDives(
    @CurrentUser() user?: { id: string },
    @Query('lang') lang?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? Math.min(50, parseInt(limit, 10) || 20) : 20;
    return this.exploreService.getDeepDives(user?.id, limitNum, {
      lang,
      sort,
      page,
      limit,
    });
  }

  @Get('newsroom')
  @UseGuards(OptionalJwtAuthGuard)
  async getNewsroom(
    @CurrentUser() user?: { id: string },
    @Query('lang') lang?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const limitNum = limit ? Math.min(50, parseInt(limit, 10) || 20) : 20;
      return await this.exploreService.getNewsroom(user?.id, limitNum, {
        lang,
        sort,
        page,
        limit,
      });
    } catch (err) {
      console.error('explore/newsroom error', err);
      return { items: [], hasMore: false };
    }
  }

  @Get('newest')
  @UseGuards(OptionalJwtAuthGuard)
  async getNewest(
    @CurrentUser() user?: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? Math.min(50, parseInt(limit, 10) || 20) : 20;
    return this.exploreService.getNewest(user?.id, limitNum, { page, limit });
  }

  @Get('for-you')
  @UseGuards(AuthGuard('jwt'))
  async getForYou(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getRecommendedPosts(
      user.id,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('recommended-people')
  @UseGuards(AuthGuard('jwt'))
  async getRecommendedPeople(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
  ) {
    const list = await this.recommendationService.getRecommendedPeople(
      user.id,
      limit ? parseInt(limit, 10) : 20,
    );
    return this.withAvatar(list);
  }
}
