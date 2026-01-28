import {
  Controller,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InteractionsService } from './interactions.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('posts') // Nesting under posts for standard REST feel
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post(':id/view')
  @UseGuards(OptionalJwtAuthGuard)
  view(@Param('id', ParseUUIDPipe) postId: string) {
    // Fire and forget - don't wait for Redis
    this.interactionsService
      .recordView(postId)
      .catch((err) => console.error('View record failed', err));
    return { ok: true };
  }

  @Post(':id/read-time')
  @UseGuards(AuthGuard('jwt'))
  async recordTime(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) postId: string,
    @Body() body: { duration: number },
  ) {
    await this.interactionsService.recordReadDuration(
      user.id,
      postId,
      body.duration,
    );
    return { ok: true };
  }

  @Post(':id/like')
  @UseGuards(AuthGuard('jwt'))
  async like(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) postId: string,
  ) {
    return this.interactionsService.toggleLike(user.id, postId);
  }

  @Post(':id/keep')
  @UseGuards(AuthGuard('jwt'))
  async keep(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) postId: string,
  ) {
    return this.interactionsService.toggleKeep(user.id, postId);
  }
}
