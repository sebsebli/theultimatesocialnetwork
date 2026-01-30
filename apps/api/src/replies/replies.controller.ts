import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RepliesService } from './replies.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('posts/:postId/replies')
export class RepliesController {
  constructor(private readonly repliesService: RepliesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @CurrentUser() user: { id: string },
    @Param('postId') postId: string,
    @Body() dto: { body: string; parentReplyId?: string },
  ) {
    return this.repliesService.create(
      user.id,
      postId,
      dto.body,
      dto.parentReplyId,
    );
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Param('postId') postId: string,
    @Query('parentReplyId') parentReplyId: string | undefined,
    @CurrentUser() user?: { id: string },
  ) {
    return this.repliesService.findByPost(
      postId,
      50,
      0,
      user?.id,
      parentReplyId || undefined,
    );
  }

  @Get(':replyId')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('postId') postId: string,
    @Param('replyId') replyId: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.repliesService.findOne(postId, replyId, user?.id);
  }

  @Post(':replyId/like')
  @UseGuards(AuthGuard('jwt'))
  async like(
    @CurrentUser() user: { id: string },
    @Param('postId') _postId: string,
    @Param('replyId') replyId: string,
  ) {
    return this.repliesService.likeReply(replyId, user.id);
  }

  @Delete(':replyId/like')
  @UseGuards(AuthGuard('jwt'))
  async unlike(
    @CurrentUser() user: { id: string },
    @Param('postId') _postId: string,
    @Param('replyId') replyId: string,
  ) {
    return this.repliesService.unlikeReply(replyId, user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(
    @CurrentUser() user: { id: string },
    @Param('id') replyId: string,
  ) {
    await this.repliesService.delete(user.id, replyId);
    return { success: true };
  }
}
