import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { MeilisearchService } from './meilisearch.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { UploadService } from '../upload/upload.service';

@Controller('search')
export class SearchController {
  constructor(
    private readonly meilisearch: MeilisearchService,
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    private dataSource: DataSource,
    private readonly uploadService: UploadService,
  ) {}

  @Get('posts')
  @UseGuards(OptionalJwtAuthGuard)
  async searchPosts(
    @CurrentUser() _user: { id: string } | null,
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('lang') lang?: string,
    @Query('topicSlug') topicSlug?: string,
  ) {
    if (!query || query.trim().length === 0) {
      return { hits: [], estimatedTotalHits: 0 };
    }
    let topicId: string | undefined;
    if (topicSlug?.trim()) {
      const topic = await this.topicRepo.findOne({
        where: { slug: topicSlug.trim() },
        select: ['id'],
      });
      topicId = topic?.id;
      if (!topicId) return { hits: [], estimatedTotalHits: 0 };
    }
    const results = await this.meilisearch.searchPosts(query, {
      limit,
      offset,
      lang,
      topicId,
    });
    const hits = (results.hits || []) as { id?: string }[];
    if (hits.length === 0) return results;
    const ids = hits.map((h) => h.id).filter(Boolean) as string[];
    const posts = await this.postRepo.find({
      where: { id: In(ids) },
      select: ['id', 'headerImageKey'],
    });
    const byId = new Map(posts.map((p) => [p.id, p]));
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const hydrated = hits.map((h) => {
      const post = h.id != null ? byId.get(h.id) : undefined;
      const headerImageKey =
        post?.headerImageKey ??
        (h as { headerImageKey?: string }).headerImageKey ??
        null;
      const headerImageUrl =
        headerImageKey != null && headerImageKey !== ''
          ? getImageUrl(headerImageKey)
          : null;
      return {
        ...h,
        headerImageKey: headerImageKey ?? undefined,
        headerImageUrl: headerImageUrl ?? undefined,
      };
    });
    return { ...results, hits: hydrated };
  }

  @Get('users')
  @UseGuards(OptionalJwtAuthGuard)
  async searchUsers(
    @CurrentUser() _user: { id: string } | null,
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    if (!query || query.trim().length === 0) {
      return { hits: [], estimatedTotalHits: 0 };
    }
    const res = await this.meilisearch.searchUsers(query, limit, offset);
    const hits = (res.hits || []) as { id?: string; avatarKey?: string }[];
    if (hits.length === 0) return res;
    const ids = hits.map((h) => h.id).filter(Boolean) as string[];
    const users = await this.userRepo.find({
      where: { id: In(ids) },
      select: ['id', 'avatarKey'],
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const hydrated = hits.map((h) => {
      const u = h.id != null ? byId.get(h.id) : undefined;
      const avatarKey = u?.avatarKey ?? h.avatarKey ?? null;
      const avatarUrl =
        avatarKey != null && avatarKey !== '' ? getImageUrl(avatarKey) : null;
      return {
        ...h,
        avatarKey: avatarKey ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
      };
    });
    return { ...res, hits: hydrated };
  }

  @Get('all')
  @UseGuards(OptionalJwtAuthGuard)
  async searchAll(
    @CurrentUser() _user: { id: string } | null,
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim().length === 0) {
      return { posts: [], users: [], topics: [] };
    }
    const result = await this.meilisearch.searchAll(query, limit);
    const users = (result.users || []) as { id?: string }[];
    if (users.length === 0) return result;
    const ids = users.map((u) => u.id).filter(Boolean) as string[];
    const fromDb = await this.userRepo.find({
      where: { id: In(ids) },
      select: ['id', 'avatarKey'],
    });
    const byId = new Map(fromDb.map((u) => [u.id, u]));
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const hydratedUsers = users.map((h) => {
      const u = h.id != null ? byId.get(h.id) : undefined;
      const avatarKey =
        u?.avatarKey ?? (h as { avatarKey?: string }).avatarKey ?? null;
      const avatarUrl =
        avatarKey != null && avatarKey !== '' ? getImageUrl(avatarKey) : null;
      return {
        ...h,
        avatarKey: avatarKey ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
      };
    });
    return { ...result, users: hydratedUsers };
  }

  @Get('topics')
  @UseGuards(OptionalJwtAuthGuard)
  async searchTopics(
    @CurrentUser() _user: { id: string } | null,
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    if (!query || query.trim().length === 0) {
      return { hits: [] };
    }
    const res = await this.meilisearch.searchTopics(query, limit, offset);
    const hits = (res.hits || []) as {
      id?: string;
      slug?: string;
      title?: string;
    }[];
    if (hits.length === 0) return res;
    const topicIds = hits.map((h) => h.id).filter(Boolean) as string[];
    type LatestRow = { topicId: string; postId: string };
    const latestRows: LatestRow[] =
      topicIds.length > 0
        ? await this.dataSource
            .createQueryBuilder()
            .select('pt.topic_id', 'topicId')
            .addSelect('p.id', 'postId')
            .from(PostTopic, 'pt')
            .innerJoin(Post, 'p', 'p.id = pt.post_id AND p.deleted_at IS NULL')
            .where('pt.topic_id IN (:...topicIds)', { topicIds })
            .orderBy('pt.topic_id')
            .addOrderBy('p.created_at', 'DESC')
            .distinctOn(['pt.topic_id'])
            .getRawMany<LatestRow>()
            .catch(() => [])
        : [];
    const postIds = [...new Set(latestRows.map((r) => r.postId))];
    const topicToPostId = new Map(latestRows.map((r) => [r.topicId, r.postId]));
    const posts =
      postIds.length > 0
        ? await this.postRepo.find({
            where: { id: In(postIds) },
            relations: ['author'],
            select: [
              'id',
              'authorId',
              'title',
              'body',
              'headerImageKey',
              'createdAt',
            ],
          })
        : [];
    const postMap = new Map(posts.map((p) => [p.id, p]));
    function bodyExcerpt(body: string, maxLen = 120): string {
      if (!body || typeof body !== 'string') return '';
      const stripped = body
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/\n+/g, ' ')
        .trim();
      return stripped.length <= maxLen
        ? stripped
        : stripped.slice(0, maxLen) + '…';
    }
    const hydrated = hits.map((h) => {
      const postId = topicToPostId.get(h.id!);
      const post = postId ? postMap.get(postId) : undefined;
      const recentPost = post
        ? {
            id: post.id,
            title: post.title ?? null,
            bodyExcerpt: bodyExcerpt(post.body),
            headerImageKey: post.headerImageKey ?? null,
            author: post.author
              ? {
                  handle: post.author.handle,
                  displayName: post.author.displayName ?? post.author.handle,
                }
              : null,
            createdAt: post.createdAt?.toISOString?.() ?? null,
          }
        : null;
      return {
        ...h,
        recentPostImageKey: recentPost?.headerImageKey ?? null,
        recentPost,
      };
    });
    return { ...res, hits: hydrated };
  }
}
