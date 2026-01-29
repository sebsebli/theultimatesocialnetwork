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
  NotFoundException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Queue } from 'bullmq';
import { User } from '../entities/user.entity';
import { postToPlain, userToPlain } from '../shared/post-serializer';

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
    if (!me) {
      throw new NotFoundException('User no longer exists');
    }
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
  @UseGuards(OptionalJwtAuthGuard)
  async getSuggested(
    @CurrentUser() user?: { id: string },
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const list = await this.usersService.getSuggested(user?.id, limitNum);
    return list.map((u) => userToPlain(u));
  }

  @Get('me/suggested')
  @UseGuards(AuthGuard('jwt'))
  async getMySuggested(
    @CurrentUser() user: { id: string },
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const list = await this.usersService.getSuggested(user.id, limit);
    return list.map((u) => userToPlain(u));
  }

  @Get('me/posts')
  @UseGuards(AuthGuard('jwt'))
  async getMyPosts(
    @CurrentUser() user: { id: string },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type: 'posts' | 'replies' | 'quotes' = 'posts',
  ) {
    return this.usersService.getUserPosts(user.id, page, limit, type);
  }

  @Get(':id/posts')
  async getUserPosts(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type: 'posts' | 'replies' | 'quotes' = 'posts',
  ) {
    if (id === 'me') {
      throw new NotFoundException('Use GET /users/me/posts for current user');
    }
    const userId = await this.usersService.resolveUserId(id);
    if (!userId) throw new NotFoundException('User not found');
    return this.usersService.getUserPosts(userId, page, limit, type);
  }

  @Get(':id/replies')
  async getReplies(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const userId = await this.usersService.resolveUserId(id);
    if (!userId) throw new NotFoundException('User not found');
    const result = await this.usersService.getUserPosts(
      userId,
      page,
      limit,
      'replies',
    );
    return result;
  }

  @Get(':id/quotes')
  async getQuotes(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const userId = await this.usersService.resolveUserId(id);
    if (!userId) throw new NotFoundException('User not found');
    const result = await this.usersService.getUserPosts(
      userId,
      page,
      limit,
      'quotes',
    );
    return result;
  }

  @Get(':id/collections')
  async getUserCollections(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const userId = await this.usersService.resolveUserId(id);
    if (!userId) throw new NotFoundException('User not found');
    return this.usersService.getUserPublicCollections(userId, page, limit);
  }

  @Get(':idOrHandle/following')
  async getFollowingByUser(@Param('idOrHandle') idOrHandle: string) {
    const userId = await this.usersService.resolveUserId(idOrHandle);
    if (!userId) throw new NotFoundException('User not found');
    const following = await this.usersService.getFollowing(userId);
    return following.map(userToPlain);
  }

  @Get(':idOrHandle/followers')
  async getFollowersByUser(@Param('idOrHandle') idOrHandle: string) {
    const userId = await this.usersService.resolveUserId(idOrHandle);
    if (!userId) throw new NotFoundException('User not found');
    const followers = await this.usersService.getFollowers(userId);
    return followers.map(userToPlain);
  }

  @Get(':handle')
  async findOne(@Param('handle') handle: string) {
    const user = await this.usersService.findByHandle(handle);
    return userToPlain(user);
  }
}
