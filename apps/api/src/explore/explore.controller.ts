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
      const avatarUrl = avatarKey ? this.uploadService.getImageUrl(avatarKey) : null;
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
  ) {
    const limitNum = limit ? Math.min(50, parseInt(limit, 10) || 20) : 20;
    let list: User[];
    if (user?.id && (!sort || sort === 'recommended')) {
      try {
        list = await this.recommendationService.getRecommendedPeople(
          user.id,
          limitNum,
        );
      } catch (err) {
        console.error('explore/people recommended error', err);
        list = await this.exploreService.getPeople(user.id, limitNum, {
          sort: 'cited',
        });
      }
    } else {
      list = await this.exploreService.getPeople(user?.id, limitNum, { sort });
    }
    return this.withAvatar(list);
  }

  @Get('quoted-now')
  @UseGuards(OptionalJwtAuthGuard)
  async getQuotedNow(
    @CurrentUser() user?: { id: string },
    @Query('lang') lang?: string,
    @Query('sort') sort?: string,
  ) {
    return this.exploreService.getQuotedNow(user?.id, 20, { lang, sort });
  }

  @Get('deep-dives')
  @UseGuards(OptionalJwtAuthGuard)
  async getDeepDives(
    @CurrentUser() user?: { id: string },
    @Query('lang') lang?: string,
    @Query('sort') sort?: string,
  ) {
    return this.exploreService.getDeepDives(user?.id, 20, { lang, sort });
  }

  @Get('newsroom')
  @UseGuards(OptionalJwtAuthGuard)
  async getNewsroom(
    @CurrentUser() user?: { id: string },
    @Query('lang') lang?: string,
    @Query('sort') sort?: string,
  ) {
    try {
      return await this.exploreService.getNewsroom(user?.id, 20, {
        lang,
        sort,
      });
    } catch (err) {
      console.error('explore/newsroom error', err);
      return [];
    }
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
