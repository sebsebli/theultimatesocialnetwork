import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Query,
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
import { postToPlain, extractLinkedPostIds } from '../shared/post-serializer';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { UploadService } from '../upload/upload.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(user.id, dto);
  }

  @Get('source-previews')
  async getSourcePreviews(
    @Query('postIds') postIdsStr?: string,
    @Query('topicSlugs') topicSlugsStr?: string,
  ) {
    const postIds =
      postIdsStr
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    const topicSlugs =
      topicSlugsStr
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    return this.postsService.getSourcePreviews(postIds, topicSlugs);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: { id: string },
  ) {
    const post = await this.postsService.findOne(id, user?.id);
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const linkedIds = extractLinkedPostIds(post?.body);
    const referenceMetadata =
      linkedIds.length > 0
        ? await this.postsService.getTitlesForPostIds(linkedIds)
        : undefined;
    const plain = postToPlain(post, getImageUrl, referenceMetadata);
    return plain ?? {};
  }

  @Get(':id/sources')
  async getSources(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getSources(id);
  }

  @Get(':id/referenced-by')
  async getReferencedBy(@Param('id', ParseUUIDPipe) id: string) {
    const posts = await this.postsService.getReferencedBy(id);
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    return posts.map((p) => postToPlain(p, getImageUrl)).filter(Boolean);
  }

  @Get(':id/quotes')
  async getQuotes(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getQuotes(id);
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
  @Throttle({ default: { limit: 20, ttl: 60000 } })
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
