import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { TopicsService } from './topics.service';
import { TopicFollowsService } from './topic-follows.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { postToPlain } from '../shared/post-serializer';
import { UploadService } from '../upload/upload.service';
import { Post as PostEntity } from '../entities/post.entity';

@Controller('topics')
export class TopicsController {
  constructor(
    private readonly topicsService: TopicsService,
    private readonly topicFollowsService: TopicFollowsService,
    private readonly uploadService: UploadService,
  ) { }

  /** Serialize post list to plain objects (avoid leaking raw entities). */
  private serializePosts(result: {
    items: PostEntity[];
    hasMore: boolean;
  }): { items: Record<string, unknown>[]; hasMore: boolean } {
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const items = result.items
      .map((p) => postToPlain(p, getImageUrl))
      .filter(Boolean) as Record<string, unknown>[];
    return { items, hasMore: result.hasMore };
  }

  @Get('me/following')
  @UseGuards(AuthGuard('jwt'))
  async getFollowed(@CurrentUser() user: { id: string }) {
    return this.topicFollowsService.getFollowedTopics(user.id);
  }

  @Get(':slug/map')
  @UseGuards(OptionalJwtAuthGuard)
  async getMap(
    @Param('slug') slug: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.topicsService.getTopicMap(slug, user?.id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('slug') slug: string,
    @CurrentUser() user?: { id: string },
  ) {
    try {
      const topic = await this.topicsService.findOne(slug, user?.id);
      if (!topic) {
        throw new NotFoundException('Topic not found');
      }
      let isFollowing = false;
      if (user) {
        try {
          isFollowing = await this.topicFollowsService.isFollowing(
            user.id,
            topic.id,
          );
        } catch {
          // Don't fail the whole request if follow check fails
        }
      }
      return { ...topic, isFollowing };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.error('topics findOne error', slug, err);
      throw err;
    }
  }

  @Get(':slug/posts')
  @UseGuards(OptionalJwtAuthGuard)
  async getPosts(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string } | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('sort') sort: 'ranked' | 'recent' = 'recent',
  ) {
    try {
      const topic = await this.topicsService.findOne(slug, user?.id);
      if (!topic) return { items: [], hasMore: false };
      const offset = (page - 1) * limit;
      const result = await this.topicsService.getTopicPosts(
        topic.id,
        sort,
        limit,
        offset,
        user?.id,
      );
      return this.serializePosts(result);
    } catch (err) {
      console.error('topics getPosts error', slug, err);
      return { items: [], hasMore: false };
    }
  }

  @Get(':slug/people')
  @UseGuards(OptionalJwtAuthGuard)
  async getPeople(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string } | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    try {
      const topic = await this.topicsService.findOne(slug, user?.id);
      if (!topic) throw new NotFoundException('Topic not found');

      const offset = (page - 1) * limit;
      const people = await this.topicsService.getTopicPeople(
        topic.id,
        limit,
        offset,
        user?.id,
      );
      return {
        items: people,
        hasMore: people.length === limit,
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.error('topics getPeople error', slug, err);
      return { items: [], hasMore: false };
    }
  }

  @Get(':slug/sources')
  @UseGuards(OptionalJwtAuthGuard)
  async getSources(
    @Param('slug') slug: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @CurrentUser() user?: { id: string },
  ) {
    try {
      const topic = await this.topicsService.findOne(slug, user?.id);
      if (!topic) throw new NotFoundException('Topic not found');

      const offset = (page - 1) * limit;
      const sources = await this.topicsService.getTopicSources(
        topic.id,
        limit,
        offset,
        user?.id,
      );
      return {
        items: sources,
        hasMore: sources.length === limit,
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.error('topics getSources error', slug, err);
      return { items: [], hasMore: false };
    }
  }

  @Post(':slug/follow')
  @UseGuards(AuthGuard('jwt'))
  async follow(
    @CurrentUser() user: { id: string },
    @Param('slug') slug: string,
  ) {
    const topic = await this.topicsService.findOne(slug);
    if (!topic) {
      throw new Error('Topic not found');
    }
    return this.topicFollowsService.follow(user.id, topic.id);
  }

  @Delete(':slug/follow')
  @UseGuards(AuthGuard('jwt'))
  async unfollow(
    @CurrentUser() user: { id: string },
    @Param('slug') slug: string,
  ) {
    const topic = await this.topicsService.findOne(slug);
    if (!topic) {
      throw new Error('Topic not found');
    }
    return this.topicFollowsService.unfollow(user.id, topic.id);
  }
}
