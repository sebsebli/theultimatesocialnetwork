import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TopicsService } from './topics.service';
import { TopicFollowsService } from './topic-follows.service';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('topics')
export class TopicsController {
  constructor(
    private readonly topicsService: TopicsService,
    private readonly topicFollowsService: TopicFollowsService,
  ) {}

  @Get('me/following')
  @UseGuards(AuthGuard('jwt'))
  async getFollowed(@CurrentUser() user: { id: string }) {
    return this.topicFollowsService.getFollowedTopics(user.id);
  }

  @Get(':slug')
  async findOne(
    @Param('slug') slug: string,
    @CurrentUser() user?: { id: string },
  ) {
    const topic = await this.topicsService.findOne(slug);
    if (!topic) {
      throw new Error('Topic not found');
    }
    // Mobile app now fetches posts separately via /posts endpoint
    let isFollowing = false;
    if (user) {
      isFollowing = await this.topicFollowsService.isFollowing(
        user.id,
        topic.id,
      );
    }
    return { ...topic, isFollowing };
  }

  @Get(':slug/posts')
  async getPosts(
    @Param('slug') slug: string,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('sort') sort: 'ranked' | 'recent' = 'recent',
  ) {
    const topic = await this.topicsService.findOne(slug);
    if (!topic) throw new Error('Topic not found');

    const offset = (page - 1) * limit;
    const posts = await this.topicsService.getTopicPosts(
      topic.id,
      sort,
      limit,
      offset,
    );
    return {
      items: posts,
      hasMore: posts.length === limit,
    };
  }

  @Get(':slug/people')
  async getPeople(
    @Param('slug') slug: string,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    const topic = await this.topicsService.findOne(slug);
    if (!topic) throw new Error('Topic not found');

    const offset = (page - 1) * limit;
    const people = await this.topicsService.getTopicPeople(
      topic.id,
      limit,
      offset,
    );
    return {
      items: people,
      hasMore: people.length === limit,
    };
  }

  @Get(':slug/sources')
  async getSources(
    @Param('slug') slug: string,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    const topic = await this.topicsService.findOne(slug);
    if (!topic) throw new Error('Topic not found');

    const offset = (page - 1) * limit;
    const sources = await this.topicsService.getTopicSources(
      topic.id,
      limit,
      offset,
    );
    return {
      items: sources,
      hasMore: sources.length === limit,
    };
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
