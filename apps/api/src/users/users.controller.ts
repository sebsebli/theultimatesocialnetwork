import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { Queue } from 'bullmq';
import { User } from '../entities/user.entity';
import {
  postToPlain,
  replyToPlain,
  userToPlain,
} from '../shared/post-serializer';

@Controller('users')
@SkipThrottle() // GET /users/me is hit on every app load; avoid 429 on cold start
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject('EXPORT_QUEUE') private exportQueue: Queue,
  ) {}

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  async updateMe(
    @CurrentUser() user: { id: string },
    @Body()
    updates: {
      displayName?: string;
      handle?: string;
      bio?: string;
      isProtected?: boolean;
      languages?: string[];
      preferences?: Record<string, any>;
    },
  ) {
    // Whitelist allowed fields to prevent arbitrary entity updates
    const allowedUpdates: Partial<User> = {};
    if (updates.displayName !== undefined)
      allowedUpdates.displayName = updates.displayName;
    if (updates.bio !== undefined) allowedUpdates.bio = updates.bio;
    if (updates.isProtected !== undefined)
      allowedUpdates.isProtected = updates.isProtected;
    if (updates.languages !== undefined)
      allowedUpdates.languages = updates.languages;
    if (updates.preferences !== undefined)
      allowedUpdates.preferences = updates.preferences;
    if (updates.handle !== undefined) {
      allowedUpdates.handle = updates.handle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');
    }
    return this.usersService.update(user.id, allowedUpdates);
  }

  @Get('handle/available')
  async checkHandleAvailable(
    @Query('handle') handle: string,
    @CurrentUser() currentUser?: { id: string },
  ) {
    const available = await this.usersService.isHandleAvailable(
      handle || '',
      currentUser?.id,
    );
    return { available };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@CurrentUser() user: { id: string }) {
    const me = await this.usersService.findById(user.id);
    if (!me) return null;
    // Keep email/preferences for self, but serialize posts
    return {
      ...me,
      posts: me.posts?.map(postToPlain),
    };
  }

  @Get('me/following')
  @UseGuards(AuthGuard('jwt'))
  async getFollowing(@CurrentUser() user: { id: string }) {
    const following = await this.usersService.getFollowing(user.id);
    return following.map(userToPlain);
  }

  @Get('me/followers')
  @UseGuards(AuthGuard('jwt'))
  async getFollowers(@CurrentUser() user: { id: string }) {
    const followers = await this.usersService.getFollowers(user.id);
    return followers.map(userToPlain);
  }

  @Delete('me/followers/:id')
  @UseGuards(AuthGuard('jwt'))
  async removeFollower(
    @CurrentUser() user: { id: string },
    @Param('id') followerId: string,
  ) {
    return this.usersService.removeFollower(user.id, followerId);
  }

  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  async deleteMe(@CurrentUser() user: { id: string }) {
    return this.usersService.deleteUser(user.id);
  }

  @Get('me/export')
  @UseGuards(AuthGuard('jwt'))
  async exportData(@CurrentUser() user: { id: string; email?: string }) {
    // In a real app, email should be in JWT or fetched from DB
    // The strategy returns { id: payload.sub, email: payload.email }
    const email: string =
      typeof user.email === 'string' ? user.email : 'user@example.com';

    await this.exportQueue.add('export-job', {
      userId: user.id,
      email,
    });

    return { message: 'Export started. You will receive an email shortly.' };
  }

  @Get('suggested')
  async getSuggested() {
    return this.usersService.getSuggested();
  }

  @Get(':id/replies')
  async getReplies(@Param('id') id: string) {
    const replies = await this.usersService.getReplies(id);
    return replies.map(replyToPlain);
  }

  @Get(':id/quotes')
  async getQuotes(@Param('id') id: string) {
    const quotes = await this.usersService.getQuotes(id);
    return quotes.map(postToPlain);
  }

  @Get(':handle')
  async findOne(@Param('handle') handle: string) {
    const user = await this.usersService.findByHandle(handle);
    return userToPlain(user);
  }
}
