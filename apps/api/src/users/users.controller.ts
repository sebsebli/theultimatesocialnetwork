import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
  NotFoundException,
  HttpException,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Queue } from 'bullmq';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import {
  postToPlain,
  userToPlain,
  replyToPlain,
} from '../shared/post-serializer';
import { UploadService } from '../upload/upload.service';

@Controller('users')
@SkipThrottle() // GET /users/me is hit on every app load; avoid 429 on cold start
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject('EXPORT_QUEUE') private exportQueue: Queue,
    private readonly uploadService: UploadService,
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
      avatarKey?: string | null;
      profileHeaderKey?: string | null;
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
    if (updates.avatarKey !== undefined)
      allowedUpdates.avatarKey = updates.avatarKey;
    if (updates.profileHeaderKey !== undefined)
      allowedUpdates.profileHeaderKey = updates.profileHeaderKey;
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
    const needsOnboarding =
      typeof me.handle === 'string' && me.handle.startsWith('__pending_');
    const plain = userToPlain(me) as Record<string, unknown>;
    const avatarUrl = me.avatarKey
      ? this.uploadService.getImageUrl(me.avatarKey)
      : null;
    const profileHeaderUrl = me.profileHeaderKey
      ? this.uploadService.getImageUrl(me.profileHeaderKey)
      : null;
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const profileBackgroundColor = '#0B0B0C';
    const threshold = await this.usersService.getQuotesBadgeThreshold();
    const quotesBadgeEligible = (me.quoteReceivedCount ?? 0) >= threshold;
    return {
      ...plain,
      avatarUrl,
      profileHeaderUrl,
      profileBackgroundColor,
      needsOnboarding,
      quotesBadgeEligible,
      posts: me.posts?.map((p) => postToPlain(p, getImageUrl)),
    };
  }

  private withAvatarUrl(u: User | null): Record<string, unknown> | null {
    const plain = userToPlain(u);
    if (!plain || !u) return plain;
    const avatarUrl = u.avatarKey
      ? this.uploadService.getImageUrl(u.avatarKey)
      : null;
    const profileHeaderUrl = u.profileHeaderKey
      ? this.uploadService.getImageUrl(u.profileHeaderKey)
      : null;
    const profileBackgroundColor = '#0B0B0C';
    return { ...plain, avatarUrl, profileHeaderUrl, profileBackgroundColor };
  }

  @Get('me/notification-prefs')
  @UseGuards(AuthGuard('jwt'))
  async getNotificationPrefs(@CurrentUser() user: { id: string }) {
    return this.usersService.getNotificationPrefs(user.id);
  }

  @Patch('me/notification-prefs')
  @UseGuards(AuthGuard('jwt'))
  async updateNotificationPrefs(
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      push_enabled?: boolean;
      replies?: boolean;
      quotes?: boolean;
      mentions?: boolean;
      dms?: boolean;
      follows?: boolean;
      saves?: boolean;
    },
  ) {
    return this.usersService.updateNotificationPrefs(user.id, body);
  }

  @Get('me/following')
  @UseGuards(AuthGuard('jwt'))
  async getFollowing(@CurrentUser() user: { id: string }) {
    const following = await this.usersService.getFollowing(user.id);
    return following.map((u) => this.withAvatarUrl(u));
  }

  @Get('me/followers')
  @UseGuards(AuthGuard('jwt'))
  async getFollowers(@CurrentUser() user: { id: string }) {
    const followers = await this.usersService.getFollowers(user.id);
    return followers.map((u) => this.withAvatarUrl(u));
  }

  @Delete('me/followers/:id')
  @UseGuards(AuthGuard('jwt'))
  async removeFollower(
    @CurrentUser() user: { id: string },
    @Param('id') followerId: string,
  ) {
    return this.usersService.removeFollower(user.id, followerId);
  }

  /** Request account deletion. Sends a confirmation email with a link; account is only deleted when that link is used. */
  @Post('me/request-deletion')
  @UseGuards(AuthGuard('jwt'))
  async requestAccountDeletion(
    @CurrentUser() user: { id: string; email?: string },
    @Body() body: { reason?: string; lang?: string },
  ) {
    const email = typeof user.email === 'string' ? user.email : undefined;
    if (!email) {
      throw new NotFoundException(
        'Your account has no email; contact support to delete your account.',
      );
    }
    return this.usersService.requestAccountDeletion(
      user.id,
      email,
      body.reason?.trim() || null,
      body.lang || 'en',
    );
  }

  /** Confirm account deletion via token from email link. No auth required. */
  @Post('confirm-deletion')
  async confirmDeletion(@Body() body: { token: string }) {
    const token = body?.token?.trim();
    if (!token) {
      throw new NotFoundException('Missing token.');
    }
    return this.usersService.confirmAccountDeletion(token);
  }

  /** GET confirm-deletion?token=xxx — for link in email; returns HTML so user sees result in browser. */
  @Get('confirm-deletion')
  async confirmDeletionGet(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const t = token?.trim();
    if (!t) {
      res
        .status(400)
        .contentType('text/html')
        .send(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invalid link</title></head><body style="font-family:system-ui;background:#0B0B0C;color:#F2F2F2;padding:2rem;text-align:center;"><h1>Invalid link</h1><p>This confirmation link is invalid or missing a token.</p></body></html>',
        );
      return;
    }
    try {
      await this.usersService.confirmAccountDeletion(t);
      res
        .status(200)
        .contentType('text/html')
        .send(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Account deleted</title></head><body style="font-family:system-ui;background:#0B0B0C;color:#F2F2F2;padding:2rem;text-align:center;"><h1>Account deleted</h1><p>Your Cite account has been permanently deleted.</p></body></html>',
        );
    } catch {
      res
        .status(400)
        .contentType('text/html')
        .send(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invalid or expired link</title></head><body style="font-family:system-ui;background:#0B0B0C;color:#F2F2F2;padding:2rem;text-align:center;"><h1>Invalid or expired link</h1><p>This confirmation link is invalid or has already been used.</p></body></html>',
        );
    }
  }

  /** Request a data export. Creates zip on server and emails a download link. Rate limit: once per 24 hours. */
  @Post('me/request-export')
  @UseGuards(AuthGuard('jwt'))
  async requestExport(
    @CurrentUser() user: { id: string; email?: string },
  ): Promise<{ message: string }> {
    const canRequest = await this.usersService.canRequestDataExport(user.id);
    if (!canRequest) {
      throw new HttpException(
        'You can only request a data export once per 24 hours. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const email = typeof user.email === 'string' ? user.email : undefined;
    if (!email) {
      throw new NotFoundException(
        'Your account has no email; add an email in settings to receive the download link.',
      );
    }
    await this.usersService.recordExportRequest(user.id);
    await this.exportQueue.add('export-job', {
      userId: user.id,
      email,
    });
    return {
      message:
        'Export started. You will receive an email with a download link shortly. The link expires in 7 days and can only be used once.',
    };
  }

  /** Legacy: same as POST me/request-export but via GET. Prefer POST me/request-export. */
  @Get('me/export')
  @UseGuards(AuthGuard('jwt'))
  async exportData(@CurrentUser() user: { id: string; email?: string }) {
    return this.requestExport(user);
  }

  /** Download export file by token (from email link). No auth. One-time link. */
  @Get('download-export')
  async downloadExport(
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!token?.trim()) {
      res.status(HttpStatus.BAD_REQUEST).send('Missing token');
      return;
    }
    const exportRecord = await this.usersService.getExportByToken(token.trim());
    if (!exportRecord) {
      res.status(HttpStatus.NOT_FOUND).send('Invalid or expired download link');
      return;
    }
    const stream = await this.uploadService.getExportStream(
      exportRecord.storageKey,
    );
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="cite-export.zip"',
    );
    stream.pipe(res);
    stream.on('end', () => {
      this.usersService.deleteExport(exportRecord.id).catch(() => {});
    });
    stream.on('error', () => {
      res.end();
    });
  }

  /** Request all user data (GDPR data portability). Returns JSON-serializable export. */
  @Get('me/data')
  @UseGuards(AuthGuard('jwt'))
  async getMyData(@CurrentUser() user: { id: string }) {
    const raw = await this.usersService.exportUserData(user.id);
    if (!raw) {
      throw new NotFoundException('User not found');
    }
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const userPlain = userToPlain(raw.user) as Record<string, unknown>;
    if (raw.user?.email != null) {
      userPlain.email = raw.user.email;
    }
    const followingPlain = raw.following
      .map((f: Follow & { followee: User }) => {
        const u = f.followee;
        return u
          ? { id: u.id, handle: u.handle, displayName: u.displayName }
          : null;
      })
      .filter(Boolean);
    const followersPlain = raw.followers
      .map((f: Follow & { follower: User }) => {
        const u = f.follower;
        return u
          ? { id: u.id, handle: u.handle, displayName: u.displayName }
          : null;
      })
      .filter(Boolean);
    return {
      user: userPlain,
      posts: raw.posts.map((p) => postToPlain(p, getImageUrl)),
      replies: raw.replies.map((r) => replyToPlain(r)),
      likes: raw.likes.map((l) => ({
        postId: l.postId,
        createdAt: l.createdAt,
      })),
      keeps: raw.keeps.map((k) => ({
        postId: k.postId,
        createdAt: k.createdAt,
      })),
      following: followingPlain,
      followers: followersPlain,
      readHistory: raw.readHistory,
      notifications: raw.notifications,
      collections: raw.collections.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        isPublic: c.isPublic,
        createdAt: c.createdAt,
      })),
      notificationPrefs: raw.notificationPrefs,
      exportedAt: raw.exportedAt,
    };
  }

  @Get('suggested')
  @UseGuards(OptionalJwtAuthGuard)
  async getSuggested(
    @CurrentUser() user?: { id: string },
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const list = await this.usersService.getSuggested(user?.id, limitNum);
    return list.map((u) => this.withAvatarUrl(u));
  }

  @Get('me/suggested')
  @UseGuards(AuthGuard('jwt'))
  async getMySuggested(
    @CurrentUser() user: { id: string },
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const list = await this.usersService.getSuggested(user.id, limit);
    return list.map((u) => this.withAvatarUrl(u));
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
  @UseGuards(OptionalJwtAuthGuard)
  async getUserCollections(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @CurrentUser() currentUser?: { id: string },
  ) {
    const userId = await this.usersService.resolveUserId(id);
    if (!userId) throw new NotFoundException('User not found');
    const isOwner = currentUser?.id === userId;
    if (isOwner) {
      return this.usersService.getUserAllCollections(userId, page, limit);
    }
    return this.usersService.getUserVisibleCollections(
      userId,
      currentUser?.id ?? null,
      page,
      limit,
    );
  }

  @Get(':idOrHandle/following')
  async getFollowingByUser(@Param('idOrHandle') idOrHandle: string) {
    const userId = await this.usersService.resolveUserId(idOrHandle);
    if (!userId) throw new NotFoundException('User not found');
    const following = await this.usersService.getFollowing(userId);
    return following.map((u) => this.withAvatarUrl(u));
  }

  @Get(':idOrHandle/followers')
  async getFollowersByUser(@Param('idOrHandle') idOrHandle: string) {
    const userId = await this.usersService.resolveUserId(idOrHandle);
    if (!userId) throw new NotFoundException('User not found');
    const followers = await this.usersService.getFollowers(userId);
    return followers.map((u) => this.withAvatarUrl(u));
  }

  @Get(':handle')
  async findOne(@Param('handle') handle: string) {
    const user = await this.usersService.findByHandle(handle);
    const plain = userToPlain(user) as Record<string, unknown>;
    const avatarUrl =
      user?.avatarKey != null
        ? this.uploadService.getImageUrl(user.avatarKey)
        : null;
    const profileHeaderUrl =
      user?.profileHeaderKey != null
        ? this.uploadService.getImageUrl(user.profileHeaderKey)
        : null;
    const profileBackgroundColor = '#0B0B0C';
    const threshold = await this.usersService.getQuotesBadgeThreshold();
    const quotesBadgeEligible = (user?.quoteReceivedCount ?? 0) >= threshold;
    return {
      ...plain,
      avatarUrl,
      profileHeaderUrl,
      profileBackgroundColor,
      quotesBadgeEligible,
    };
  }
}
