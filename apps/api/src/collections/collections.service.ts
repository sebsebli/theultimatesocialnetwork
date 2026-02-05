import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Collection } from '../entities/collection.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { ExploreService } from '../explore/explore.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private collectionRepo: Repository<Collection>,
    @InjectRepository(CollectionItem)
    private itemRepo: Repository<CollectionItem>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(ExternalSource)
    private externalSourceRepo: Repository<ExternalSource>,
    private exploreService: ExploreService,
    private uploadService: UploadService,
  ) {}

  async create(
    userId: string,
    title: string,
    description?: string,
    shareSaves = false,
    isPublic = true,
  ) {
    const col = this.collectionRepo.create({
      ownerId: userId,
      title,
      description,
      isPublic,
      shareSaves,
    });
    return this.collectionRepo.save(col);
  }

  async findAll(userId: string) {
    const collections = await this.collectionRepo
      .createQueryBuilder('collection')
      .where('collection.ownerId = :userId', { userId })
      .loadRelationCountAndMap('collection.itemCount', 'collection.items')
      .orderBy('collection.createdAt', 'DESC')
      .getMany();

    const ids = collections.map((c) => c.id);
    const latestMap = await this.getLatestItemPreviewByPostDate(ids);
    return collections.map((c) => {
      const latest = latestMap[c.id] ?? null;
      const preview = this.enrichWithPreviewUrls(latest);
      return { ...c, ...preview };
    });
  }

  /** Build previewImageKey, previewImageUrl, and recentPost (with headerImageUrl) from getRecentPostForCollection result. */
  private enrichWithPreviewUrls(
    recent: {
      postId: string;
      title: string | null;
      bodyExcerpt: string;
      headerImageKey: string | null;
    } | null,
  ): {
    previewImageKey: string | null;
    previewImageUrl: string | null;
    recentPost: {
      id: string;
      title: string | null;
      bodyExcerpt: string;
      headerImageKey: string | null;
      headerImageUrl: string | null;
    } | null;
  } {
    if (!recent) {
      return {
        previewImageKey: null,
        previewImageUrl: null,
        recentPost: null,
      };
    }
    const headerImageKey = recent.headerImageKey ?? null;
    const headerImageUrl =
      headerImageKey != null && headerImageKey !== ''
        ? this.uploadService.getImageUrl(headerImageKey)
        : null;
    return {
      previewImageKey: headerImageKey,
      previewImageUrl: headerImageUrl,
      recentPost: {
        id: recent.postId,
        title: recent.title,
        bodyExcerpt: recent.bodyExcerpt,
        headerImageKey,
        headerImageUrl,
      },
    };
  }

  /** Item count and distinct contributor (post author) count for a collection. */
  private async getCollectionCounts(
    collectionId: string,
  ): Promise<{ itemCount: number; contributorCount: number }> {
    const [itemRow, contributorRow] = await Promise.all([
      this.itemRepo
        .createQueryBuilder('ci')
        .where('ci.collection_id = :collectionId', { collectionId })
        .select('COUNT(ci.id)', 'cnt')
        .getRawOne<{ cnt: string }>(),
      this.itemRepo
        .createQueryBuilder('ci')
        .innerJoin('ci.post', 'p')
        .where('ci.collection_id = :collectionId', { collectionId })
        .andWhere('p.deleted_at IS NULL')
        .select('COUNT(DISTINCT p.author_id)', 'cnt')
        .getRawOne<{ cnt: string }>(),
    ]);
    return {
      itemCount: itemRow ? parseInt(itemRow.cnt, 10) : 0,
      contributorCount: contributorRow ? parseInt(contributorRow.cnt, 10) : 0,
    };
  }

  /** Latest post per collection by post.created_at DESC (for header image = most recent post). */
  async getLatestItemPreviewByPostDate(collectionIds: string[]): Promise<
    Record<
      string,
      {
        postId: string;
        title: string | null;
        bodyExcerpt: string;
        headerImageKey: string | null;
      }
    >
  > {
    if (collectionIds.length === 0) return {};
    const items = await this.itemRepo.find({
      where: { collectionId: In(collectionIds) },
      relations: ['post'],
      order: { addedAt: 'DESC' },
    });
    const withPost = items.filter((i) => i.post && !i.post.deletedAt);
    withPost.sort(
      (a, b) =>
        new Date(b.post.createdAt).getTime() -
        new Date(a.post.createdAt).getTime(),
    );
    const seen = new Set<string>();
    const out: Record<
      string,
      {
        postId: string;
        title: string | null;
        bodyExcerpt: string;
        headerImageKey: string | null;
      }
    > = {};
    for (const item of withPost) {
      if (seen.has(item.collectionId)) continue;
      seen.add(item.collectionId);
      const body = item.post?.body;
      const bodyExcerpt =
        body && typeof body === 'string'
          ? body
              .replace(/#{1,6}\s*/g, '')
              .replace(/\*\*([^*]+)\*\*/g, '$1')
              .replace(/_([^_]+)_/g, '$1')
              .replace(/\n+/g, ' ')
              .trim()
              .slice(0, 120) + (body.length > 120 ? '…' : '')
          : '';
      out[item.collectionId] = {
        postId: item.post?.id ?? '',
        title: item.post?.title ?? null,
        bodyExcerpt,
        headerImageKey: item.post?.headerImageKey ?? null,
      };
    }
    return out;
  }

  /** Most recent post (by post.created_at) in this collection for header image. */
  async getRecentPostForCollection(collectionId: string): Promise<{
    postId: string;
    title: string | null;
    bodyExcerpt: string;
    headerImageKey: string | null;
  } | null> {
    const map = await this.getLatestItemPreviewByPostDate([collectionId]);
    return map[collectionId] ?? null;
  }

  async findOne(id: string, userId: string, limit?: number, offset?: number) {
    const collection = await this.collectionRepo.findOne({
      where: { id, ownerId: userId },
    });
    if (!collection) {
      throw new Error('Collection not found');
    }

    const [recent, counts] = await Promise.all([
      this.getRecentPostForCollection(id),
      this.getCollectionCounts(id),
    ]);
    const preview = this.enrichWithPreviewUrls(recent);

    if (limit != null && offset != null) {
      const { items, hasMore } = await this.getItemsPage(
        id,
        limit,
        offset,
        'recent',
        userId,
      );
      return { ...collection, ...preview, ...counts, items, hasMore };
    }

    const items = await this.itemRepo.find({
      where: { collectionId: id },
      relations: ['post', 'post.author'],
      order: { addedAt: 'DESC' },
    });

    return { ...collection, ...preview, ...counts, items };
  }

  /** Paginated items for a collection. sort: 'recent' = by post.created_at DESC, 'ranked' = by engagement. Caller must ensure viewer has access. Filters to posts visible to viewer. */
  async getItemsPage(
    collectionId: string,
    limit: number,
    offset: number,
    sort: 'recent' | 'ranked' = 'recent',
    viewerId?: string,
  ): Promise<{ items: CollectionItem[]; hasMore: boolean }> {
    const fetchSize = viewerId ? (limit + 1) * 2 : limit + 1;
    if (sort === 'ranked') {
      const qb = this.itemRepo
        .createQueryBuilder('ci')
        .innerJoinAndSelect('ci.post', 'p')
        .leftJoinAndSelect('p.author', 'author')
        .where('ci.collection_id = :collectionId', { collectionId })
        .andWhere('p.deleted_at IS NULL')
        .orderBy('(p.quote_count * 3 + p.reply_count)', 'DESC')
        .addOrderBy('p.created_at', 'DESC')
        .skip(offset)
        .take(fetchSize);
      const items = await qb.getMany();
      const posts = items.map((i) => i.post).filter(Boolean);
      const visiblePosts = await this.exploreService.filterPostsVisibleToViewer(
        posts,
        viewerId,
      );
      const visibleIds = new Set(visiblePosts.map((p) => p.id));
      const filtered = items.filter((i) => i.post && visibleIds.has(i.post.id));
      const hasMore = filtered.length > limit;
      const slice = filtered.slice(0, limit);
      return { items: slice, hasMore };
    }
    const qb = this.itemRepo
      .createQueryBuilder('ci')
      .innerJoinAndSelect('ci.post', 'p')
      .leftJoinAndSelect('p.author', 'author')
      .where('ci.collection_id = :collectionId', { collectionId })
      .andWhere('p.deleted_at IS NULL')
      .orderBy('p.created_at', 'DESC')
      .skip(offset)
      .take(fetchSize);
    const items = await qb.getMany();
    const posts = items.map((i) => i.post).filter(Boolean);
    const visiblePosts = await this.exploreService.filterPostsVisibleToViewer(
      posts,
      viewerId,
    );
    const visibleIds = new Set(visiblePosts.map((p) => p.id));
    const filtered = items.filter((i) => i.post && visibleIds.has(i.post.id));
    const hasMore = filtered.length > limit;
    const slice = filtered.slice(0, limit);
    return { items: slice, hasMore };
  }

  /**
   * Get a collection by id for a viewer. Owner sees full detail; others see it only if allowed
   * (can view profile and either collection is public or viewer follows owner).
   * When limit/offset are provided, returns paginated items and hasMore.
   */
  async findOneForViewer(
    collectionId: string,
    viewerId: string,
    limit?: number,
    offset?: number,
  ) {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId },
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    if (collection.ownerId === viewerId) {
      return this.findOne(collectionId, viewerId, limit, offset);
    }
    const owner = await this.userRepo.findOne({
      where: { id: collection.ownerId },
      select: ['id', 'isProtected'],
    });
    if (!owner) {
      throw new NotFoundException('Collection not found');
    }
    const canViewProfile =
      !owner.isProtected ||
      !!(
        viewerId &&
        (await this.followRepo.findOne({
          where: { followerId: viewerId, followeeId: collection.ownerId },
        }))
      );
    if (!canViewProfile) {
      throw new NotFoundException('Collection not found');
    }
    const isFollower = !!(
      viewerId &&
      (await this.followRepo.findOne({
        where: { followerId: viewerId, followeeId: collection.ownerId },
      }))
    );
    if (!collection.isPublic && !isFollower) {
      throw new NotFoundException('Collection not found');
    }
    const [recent, counts] = await Promise.all([
      this.getRecentPostForCollection(collectionId),
      this.getCollectionCounts(collectionId),
    ]);
    const preview = this.enrichWithPreviewUrls(recent);
    const enrich = (c: typeof collection) => ({ ...c, ...preview, ...counts });
    if (limit != null && offset != null) {
      const { items, hasMore } = await this.getItemsPage(
        collectionId,
        limit,
        offset,
        'recent',
        viewerId,
      );
      return { ...enrich(collection), items, hasMore };
    }
    return this.findOne(collectionId, collection.ownerId);
  }

  async getCollectionSources(
    collectionId: string,
    limit: number,
    offset: number,
    viewerId?: string,
  ): Promise<
    { id: string; url: string; title: string | null; createdAt: Date }[]
  > {
    const qb = this.externalSourceRepo
      .createQueryBuilder('es')
      .innerJoin('collection_items', 'ci', 'ci.post_id = es.post_id')
      .innerJoin(Post, 'p', 'p.id = es.post_id AND p.deleted_at IS NULL')
      .where('ci.collection_id = :collectionId', { collectionId })
      .select('es.id', 'id')
      .addSelect('es.url', 'url')
      .addSelect('es.title', 'title')
      .addSelect('es.created_at', 'createdAt')
      .addSelect('es.post_id', 'postId')
      .orderBy('es.created_at', 'DESC');
    if (!viewerId) {
      qb.innerJoin(
        User,
        'postAuthor',
        'postAuthor.id = p.author_id AND postAuthor.is_protected = false',
      );
    }
    const rows = await qb
      .skip(offset)
      .take(viewerId ? limit * 3 : limit)
      .getRawMany<{
        id: string;
        url: string;
        title: string | null;
        createdAt: Date;
        postId: string;
      }>();
    if (rows.length === 0) return [];
    if (!viewerId)
      return rows.slice(0, limit).map(({ postId: _p, ...r }) => {
        void _p;
        return r;
      });
    const postIds = [...new Set(rows.map((r) => r.postId))];
    const posts = await this.postRepo.find({
      where: { id: In(postIds) },
      relations: ['author'],
      select: ['id', 'authorId'],
    });
    const visible = await this.exploreService.filterPostsVisibleToViewer(
      posts,
      viewerId,
    );
    const visiblePostIds = new Set(visible.map((p) => p.id));
    const filtered = rows.filter((r) => visiblePostIds.has(r.postId));
    return filtered.slice(0, limit).map(({ postId: _p, ...r }) => {
      void _p;
      return r;
    });
  }

  async getCollectionContributors(
    collectionId: string,
    limit: number,
    offset: number,
    viewerId?: string,
  ): Promise<
    {
      id: string;
      handle: string;
      displayName: string;
      postCount: number;
      totalQuotes: number;
    }[]
  > {
    const fetchLimit = viewerId ? limit * 2 : limit;
    const builder = this.itemRepo.manager
      .createQueryBuilder()
      .select('author.id', 'id')
      .addSelect('author.handle', 'handle')
      .addSelect('author.display_name', 'displayName')
      .addSelect('COUNT(post.id)', 'postCount')
      .addSelect('COALESCE(SUM(post.quote_count), 0)', 'totalQuotes')
      .from(CollectionItem, 'ci')
      .innerJoin(
        Post,
        'post',
        'post.id = ci.post_id AND post.deleted_at IS NULL',
      )
      .innerJoin(User, 'author', 'author.id = post.author_id')
      .where('ci.collection_id = :collectionId', { collectionId })
      .groupBy('author.id')
      .addGroupBy('author.handle')
      .addGroupBy('author.display_name')
      .orderBy('"totalQuotes"', 'DESC')
      .addOrderBy('"postCount"', 'DESC')
      .limit(fetchLimit)
      .offset(offset);

    const raw = await builder.getRawMany<{
      id: string;
      handle: string;
      displayName: string;
      postCount: string;
      totalQuotes: string;
    }>();
    if (raw.length === 0) return [];
    const authorIds = [...new Set(raw.map((r) => r.id))];
    const users = await this.userRepo.find({
      where: { id: In(authorIds) },
      select: ['id', 'isProtected'],
    });
    const protectedSet = new Set(
      users.filter((u) => u.isProtected).map((u) => u.id),
    );
    let followingSet = new Set<string>();
    if (viewerId && protectedSet.size > 0) {
      const followees = await this.followRepo.find({
        where: {
          followerId: viewerId,
          followeeId: In([...protectedSet]),
        },
        select: ['followeeId'],
      });
      followingSet = new Set(followees.map((f) => f.followeeId));
    }
    const visible = raw.filter(
      (r) =>
        !protectedSet.has(r.id) || r.id === viewerId || followingSet.has(r.id),
    );
    return visible.slice(0, limit).map((r) => ({
      id: r.id,
      handle: r.handle,
      displayName: r.displayName ?? r.handle,
      postCount: parseInt(r.postCount, 10),
      totalQuotes: parseInt(r.totalQuotes, 10),
    }));
  }

  async addItem(collectionId: string, postId: string, note?: string) {
    // Validate ownership in controller or here via another query
    return this.itemRepo.save({ collectionId, postId, curatorNote: note });
  }

  async update(
    id: string,
    userId: string,
    dto: {
      shareSaves?: boolean;
      title?: string;
      description?: string;
      isPublic?: boolean;
    },
  ) {
    const collection = await this.collectionRepo.findOne({
      where: { id, ownerId: userId },
    });
    if (!collection) {
      throw new Error('Collection not found');
    }

    if (dto.shareSaves !== undefined) {
      collection.shareSaves = dto.shareSaves;
    }
    if (dto.title !== undefined) {
      collection.title = dto.title;
    }
    if (dto.description !== undefined) {
      collection.description = dto.description;
    }
    if (dto.isPublic !== undefined) {
      collection.isPublic = dto.isPublic;
    }

    return this.collectionRepo.save(collection);
  }

  /** Remove the collection item that links this post to this collection (by postId). */
  async removeItemByPostId(
    collectionId: string,
    postId: string,
    userId: string,
  ): Promise<void> {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId, ownerId: userId },
    });
    if (!collection) {
      throw new Error('Collection not found');
    }
    await this.itemRepo.delete({ collectionId, postId });
  }

  async removeItem(collectionId: string, itemId: string, userId: string) {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId, ownerId: userId },
    });
    if (!collection) {
      throw new Error('Collection not found');
    }

    await this.itemRepo.delete({ id: itemId, collectionId });
  }

  async delete(collectionId: string, userId: string): Promise<void> {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId, ownerId: userId },
    });
    if (!collection) {
      throw new Error('Collection not found');
    }
    await this.itemRepo.delete({ collectionId });
    await this.collectionRepo.delete(collectionId);
  }
}
