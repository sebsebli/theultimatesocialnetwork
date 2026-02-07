import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ExploreService } from './explore.service';
import { RecommendationService } from './recommendation.service';
import { UploadService } from '../upload/upload.service';
import { userToPlain, postToPlain } from '../shared/post-serializer';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../shared/current-user.decorator';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';

@Controller('explore')
export class ExploreController {
  constructor(
    private readonly exploreService: ExploreService,
    private readonly recommendationService: RecommendationService,
    private readonly uploadService: UploadService,
  ) { }

  /** Serialize post list to plain objects (avoids 500 from raw TypeORM entities; consistent image URLs). */
  private withPostPlains(result: {
    items: (Post & { reasons?: string[] })[];
    hasMore: boolean;
  }): { items: Record<string, unknown>[]; hasMore: boolean } {
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const items = result.items
      .map((p) => {
        const plain = postToPlain(p, getImageUrl);
        if (!plain) return null;
        if (p.reasons?.length) return { ...plain, reasons: p.reasons };
        return plain;
      })
      .filter((x): x is Record<string, unknown> => x != null);
    return { items, hasMore: result.hasMore };
  }

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
    try {
      const limitNum = limit ? Math.min(50, parseInt(limit, 10) || 20) : 20;
      const result = await this.exploreService.getQuotedNow(
        user?.id,
        limitNum,
        {
          lang,
          sort,
          page,
          limit,
        },
      );
      return this.withPostPlains(result);
    } catch (err) {
      console.error('explore/quoted-now error', err);
      return { items: [], hasMore: false };
    }
  }

  @Get('trending')
  @UseGuards(OptionalJwtAuthGuard)
  async getTrending(
    @CurrentUser() user?: { id: string },
    @Query('limit') limit?: string,
  ) {
    try {
      const limitNum = limit ? Math.min(50, parseInt(limit, 10) || 20) : 20;
      const posts = await this.exploreService.getTrending(user?.id, limitNum);
      const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
      const items = posts
        .map((p) => postToPlain(p, getImageUrl) ?? null)
        .filter(Boolean);
      return { items };
    } catch (err) {
      console.error('explore/trending error', err);
      return { items: [] };
    }
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
    try {
      const limitNum = limit ? Math.min(50, parseInt(limit, 10) || 20) : 20;
      const result = await this.exploreService.getDeepDives(
        user?.id,
        limitNum,
        {
          lang,
          sort,
          page,
          limit,
        },
      );
      return this.withPostPlains(result);
    } catch (err) {
      console.error('explore/deep-dives error', err);
      return { items: [], hasMore: false };
    }
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
      const result = await this.exploreService.getNewsroom(user?.id, limitNum, {
        lang,
        sort,
        page,
        limit,
      });
      return this.withPostPlains(result);
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
    try {
      const limitNum = limit ? Math.min(50, parseInt(limit, 10) || 20) : 20;
      const result = await this.exploreService.getNewest(user?.id, limitNum, {
        page,
        limit,
      });
      return this.withPostPlains(result);
    } catch (err) {
      console.error('explore/newest error', err);
      return { items: [], hasMore: false };
    }
  }

  @Get('for-you')
  @UseGuards(AuthGuard('jwt'))
  async getForYou(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    try {
      const limitNum = limit
        ? Math.min(50, Math.max(1, parseInt(limit, 10) || 20))
        : 20;
      const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
      const skip = (pageNum - 1) * limitNum;
      // Fetch one extra to determine hasMore
      const posts = await this.recommendationService.getRecommendedPosts(
        user.id,
        limitNum + 1,
        skip,
      );
      const hasMore = posts.length > limitNum;
      const result = this.withPostPlains({
        items: posts.slice(0, limitNum),
        hasMore,
      });
      return { items: result.items, hasMore: result.hasMore };
    } catch (err) {
      console.error('explore/for-you error', err);
      return { items: [], hasMore: false };
    }
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
