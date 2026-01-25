import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RepliesService } from './replies.service';
import { CurrentUser } from '../shared/current-user.decorator';

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
    return this.repliesService.create(user.id, postId, dto.body, dto.parentReplyId);
  }

  @Get()
  async findAll(@Param('postId') postId: string) {
    return this.repliesService.findByPost(postId);
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
