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
import { UsersService } from './users.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { Queue } from 'bullmq';
import { User } from '../entities/user.entity';

@Controller('users')
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
    },
  ) {
    // Whitelist allowed fields to prevent arbitrary entity updates
    const allowedUpdates: Record<string, unknown> = {
      displayName: updates.displayName,
      bio: updates.bio,
      isProtected: updates.isProtected,
      languages: updates.languages,
    };
    if (updates.handle !== undefined) {
      allowedUpdates.handle = updates.handle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');
    }
    return this.usersService.update(user.id, allowedUpdates as Partial<User>);
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
    return this.usersService.findById(user.id);
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
    // Assuming user object has email or we fetch it.
    // The strategy returns { id: payload.sub, email: payload.email }

    await this.exportQueue.add('export-job', {
      userId: user.id,
      email: user.email || 'user@example.com', // Fallback for dev if email missing in token
    });

    return { message: 'Export started. You will receive an email shortly.' };
  }

  @Get('suggested')
  async getSuggested() {
    return this.usersService.getSuggested();
  }

  @Get(':id/replies')
  async getReplies(@Param('id') id: string) {
    return this.usersService.getReplies(id);
  }

  @Get(':id/quotes')
  async getQuotes(@Param('id') id: string) {
    return this.usersService.getQuotes(id);
  }

  @Get(':handle')
  async findOne(@Param('handle') handle: string) {
    return this.usersService.findByHandle(handle);
  }
}
