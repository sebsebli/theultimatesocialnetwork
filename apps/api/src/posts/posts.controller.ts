import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
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
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUser } from '../shared/current-user.decorator';
import { postToPlain, extractLinkedPostIds } from '../shared/post-serializer';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { UploadService } from '../upload/upload.service';
import { InteractionsService } from '../interactions/interactions.service';
import { ExploreService } from '../explore/explore.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly uploadService: UploadService,
    private readonly interactionsService: InteractionsService,
    private readonly exploreService: ExploreService,
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

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(user.id, id, dto);
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
    let viewerState: { isLiked?: boolean; isKept?: boolean } | undefined;
    if (user?.id && post?.id) {
      const { likedIds, keptIds } =
        await this.interactionsService.getLikeKeepForViewer(user.id, [post.id]);
      viewerState = {
        isLiked: likedIds.has(post.id),
        isKept: keptIds.has(post.id),
      };
    }
    const viewerCanSeeContent =
      (post as { viewerCanSeeContent?: boolean }).viewerCanSeeContent !== false;
    const plain = postToPlain(
      post,
      getImageUrl,
      referenceMetadata,
      viewerState,
      viewerCanSeeContent,
    );
    return plain ?? {};
  }

  @Get(':id/sources')
  async getSources(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getSources(id);
  }

  @Get(':id/referenced-by')
  @UseGuards(OptionalJwtAuthGuard)
  async getReferencedBy(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: { id: string },
  ) {
    const posts = await this.postsService.getReferencedBy(id);
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const visible = await this.exploreService.filterPostsVisibleToViewer(
      posts,
      user?.id,
    );
    const visibleIds = new Set(visible.map((p) => p.id));
    return posts
      .map((p) =>
        postToPlain(p, getImageUrl, undefined, undefined, visibleIds.has(p.id)),
      )
      .filter(Boolean);
  }

  @Get(':id/quotes')
  @UseGuards(OptionalJwtAuthGuard)
  async getQuotes(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: { id: string },
  ) {
    const posts = await this.postsService.getQuotes(id);
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const visible = await this.exploreService.filterPostsVisibleToViewer(
      posts,
      user?.id,
    );
    const visibleIds = new Set(visible.map((p) => p.id));
    const items = posts
      .map((p) =>
        postToPlain(p, getImageUrl, undefined, undefined, visibleIds.has(p.id)),
      )
      .filter(Boolean);
    return { items, hasMore: false };
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

  @Get(':id/graph')
  @UseGuards(OptionalJwtAuthGuard)
  async getGraph(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getGraph(id);
  }
}

