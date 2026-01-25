import { Body, Controller, Post, Get, Param, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CurrentUser } from '../shared/current-user.decorator';

import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(user.id, dto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.postsService.findOne(id, user?.id);
  }

  @Get(':id/sources')
  async getSources(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getSources(id);
  }

  @Get(':id/referenced-by')
  async getReferencedBy(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getReferencedBy(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.softDelete(user.id, id);
  }

  @Post(':id/quote')
  @UseGuards(AuthGuard('jwt'))
  async quote(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) quotedPostId: string,
    @Body() dto: { body: string },
  ) {
    return this.postsService.createQuote(user.id, quotedPostId, dto.body);
  }
}
