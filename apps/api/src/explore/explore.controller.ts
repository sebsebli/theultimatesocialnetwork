import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ExploreService } from './explore.service';
import { RecommendationService } from './recommendation.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('explore')
export class ExploreController {
  constructor(
    private readonly exploreService: ExploreService,
    private readonly recommendationService: RecommendationService,
  ) {}

  @Get('topics')
  async getTopics(@CurrentUser() user?: { id: string }) {
    return this.exploreService.getTopics(user?.id);
  }

  @Get('people')
  async getPeople(@CurrentUser() user?: { id: string }) {
    // Use AI-powered recommendations if user is logged in
    if (user?.id) {
      return this.recommendationService.getRecommendedPeople(user.id, 20);
    }
    return this.exploreService.getPeople(user?.id);
  }

  @Get('quoted-now')
  async getQuotedNow(
    @CurrentUser() user?: { id: string },
    @Query('lang') lang?: string,
    @Query('sort') sort?: string,
  ) {
    return this.exploreService.getQuotedNow(user?.id, 20, { lang, sort });
  }

  @Get('deep-dives')
  async getDeepDives(
    @CurrentUser() user?: { id: string },
    @Query('lang') lang?: string,
    @Query('sort') sort?: string,
  ) {
    return this.exploreService.getDeepDives(user?.id, 20, { lang, sort });
  }

  @Get('newsroom')
  async getNewsroom(
    @CurrentUser() user?: { id: string },
    @Query('lang') lang?: string,
    @Query('sort') sort?: string,
  ) {
    return this.exploreService.getNewsroom(user?.id, 20, { lang, sort });
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
    return this.recommendationService.getRecommendedPeople(
      user.id,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
