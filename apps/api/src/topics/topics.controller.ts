import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
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

  @Get(':slug')
  async findOne(@Param('slug') slug: string, @CurrentUser() user?: { id: string }) {
    const topic = await this.topicsService.findOne(slug);
    if (!topic) {
      throw new Error('Topic not found');
    }
    const posts = await this.topicsService.getPosts(topic.id);
    let isFollowing = false;
    if (user) {
      isFollowing = await this.topicFollowsService.isFollowing(user.id, topic.id);
    }
    return { ...topic, posts, isFollowing };
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