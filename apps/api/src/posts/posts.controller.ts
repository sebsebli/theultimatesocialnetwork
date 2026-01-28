import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CurrentUser } from '../shared/current-user.decorator';
import { postToPlain } from '../shared/post-serializer';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Limit to 10 posts per minute to prevent spam
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
    const post = await this.postsService.findOne(id, user?.id);
    const plain = postToPlain(post);
    return plain ?? {};
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
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Limit quotes too
  async quote(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) quotedPostId: string,
    @Body() dto: { body: string },
  ) {
    if (!dto.body || dto.body.trim().length === 0) {
      throw new BadRequestException('Commentary is required for quotes');
    }
    return this.postsService.createQuote(
      user.id,
      quotedPostId,
      dto.body.trim(),
    );
  }
}
