import { Controller, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FollowsService } from './follows.service';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('users')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':id/follow')
  @UseGuards(AuthGuard('jwt'))
  async follow(
    @CurrentUser() user: { id: string },
    @Param('id') followeeId: string,
  ) {
    const result = await this.followsService.follow(user.id, followeeId);
    // When target is protected, result is a FollowRequest (pending); otherwise a Follow
    const pending =
      result &&
      typeof result === 'object' &&
      'status' in result &&
      (result as { status: string }).status === 'PENDING';
    return { pending: !!pending };
  }

  @Delete(':id/follow')
  @UseGuards(AuthGuard('jwt'))
  async unfollow(
    @CurrentUser() user: { id: string },
    @Param('id') followeeId: string,
  ) {
    return this.followsService.unfollow(user.id, followeeId);
  }
}
