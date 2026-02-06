import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Collection } from '../entities/collection.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Post } from '../entities/post.entity';
import { PostEdge, EdgeType } from '../entities/post-edge.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { ExploreService } from '../explore/explore.service';
import { UploadService } from '../upload/upload.service';

export type CollectionSourceItem =
  | {
    type: 'external';
    id: string;
    url: string;
    title: string | null;
    createdAt: Date;
  }
  | {
    type: 'post';
    id: string;
    title: string | null;
    createdAt: Date;
    headerImageKey: string | null;
    authorHandle: string | null;
  }
  | {
    type: 'topic';
    id: string;
    slug: string;
    title: string;
    createdAt: Date;
  };

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private collectionRepo: Repository<Collection>,
    @InjectRepository(CollectionItem)
    private itemRepo: Repository<CollectionItem>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(PostEdge) private postEdgeRepo: Repository<PostEdge>,
    @InjectRepository(PostTopic) private postTopicRepo: Repository<PostTopic>,
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(ExternalSource)
    private externalSourceRepo: Repository<ExternalSource>,
    private exploreService: ExploreService,
    private uploadService: UploadService,
  ) { }

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

  /** Latest post per collection by post.created_at DESC (for header image = most recent post). Uses SQL DISTINCT ON to avoid loading all items into memory. */
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

    // Use SQL DISTINCT ON to get latest post per collection efficiently
    const rows = await this.itemRepo
      .createQueryBuilder('ci')
      .innerJoin('ci.post', 'p')
      .select('ci.collection_id', 'collectionId')
      .addSelect('p.id', 'postId')
      .addSelect('p.title', 'title')
      .addSelect('SUBSTRING(p.body FROM 1 FOR 150)', 'bodyRaw')
      .addSelect('p.header_image_key', 'headerImageKey')
      .where('ci.collection_id IN (:...ids)', { ids: collectionIds })
      .andWhere('p.deleted_at IS NULL')
      .orderBy('ci.collection_id')
      .addOrderBy('p.created_at', 'DESC')
      .distinctOn(['ci.collection_id'])
      .getRawMany<{
        collectionId: string;
        postId: string;
        title: string | null;
        bodyRaw: string | null;
        headerImageKey: string | null;
      }>();

    const out: Record<
      string,
      {
        postId: string;
        title: string | null;
        bodyExcerpt: string;
        headerImageKey: string | null;
      }
    > = {};
    for (const row of rows) {
      const body = row.bodyRaw ?? '';
      const bodyExcerpt = body
        ? body
          .replace(/#{1,6}\s*/g, '')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/_([^_]+)_/g, '$1')
          .replace(/\n+/g, ' ')
          .trim()
          .slice(0, 120) + (body.length > 120 ? '…' : '')
        : '';
      out[row.collectionId] = {
        postId: row.postId ?? '',
        title: row.title ?? null,
        bodyExcerpt,
        headerImageKey: row.headerImageKey ?? null,
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

  /** Paginated items for a collection. sort: 'recent' = by post.created_at DESC, 'ranked' = by engagement. Caller must ensure viewer has access. Visibility filtered at SQL level. */
  async getItemsPage(
    collectionId: string,
    limit: number,
    offset: number,
    sort: 'recent' | 'ranked' = 'recent',
    viewerId?: string,
  ): Promise<{ items: CollectionItem[]; hasMore: boolean }> {
    const qb = this.itemRepo
      .createQueryBuilder('ci')
      .innerJoinAndSelect('ci.post', 'p')
      .leftJoinAndSelect('p.author', 'author')
      .where('ci.collection_id = :collectionId', { collectionId })
      .andWhere('p.deleted_at IS NULL');

    // SQL-level visibility filter instead of over-fetching and filtering in JS
    if (viewerId) {
      qb.andWhere(
        `(author.is_protected = false OR author.id = :viewerId OR EXISTS (
          SELECT 1 FROM follows f WHERE f.follower_id = :viewerId AND f.followee_id = author.id
        ))`,
        { viewerId },
      );
    } else {
      qb.andWhere('author.is_protected = false');
    }

    if (sort === 'ranked') {
      qb.orderBy('(p.quoteCount * 3 + p.replyCount)', 'DESC')
        .addOrderBy('p.createdAt', 'DESC');
    } else {
      qb.orderBy('p.createdAt', 'DESC');
    }

    const items = await qb.skip(offset).take(limit + 1).getMany();
    const hasMore = items.length > limit;
    const slice = items.slice(0, limit);
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
  ): Promise<CollectionSourceItem[]> {
    // 1) Post IDs in this collection
    const collectionPostIds = await this.itemRepo
      .find({ where: { collectionId }, select: ['postId'] })
      .then((rows) => rows.map((r) => r.postId));
    if (collectionPostIds.length === 0) return [];

    let visiblePostIds: Set<string>;
    if (viewerId) {
      const posts = await this.postRepo.find({
        where: { id: In(collectionPostIds) },
        relations: ['author'],
        select: ['id', 'authorId'],
      });
      const visible = await this.exploreService.filterPostsVisibleToViewer(
        posts,
        viewerId,
      );
      visiblePostIds = new Set(visible.map((p) => p.id));
    } else {
      const publicIds = (await this.postRepo.query(
        `
        SELECT p.id FROM posts p
        INNER JOIN users u ON u.id = p.author_id AND u.is_protected = false
        WHERE p.id = ANY($1::uuid[]) AND p.deleted_at IS NULL
        `,
        [collectionPostIds],
      )) as { id: string }[];
      visiblePostIds = new Set(publicIds.map((r) => r.id));
    }

    const publicClause = viewerId
      ? ''
      : `INNER JOIN users postAuthor ON postAuthor.id = p.author_id AND postAuthor.is_protected = false`;

    // 2) External sources (distinct by url) from visible collection posts
    type ExtRow = {
      id: string;
      url: string;
      title: string | null;
      createdAt: Date;
      postId: string;
    };
    const extQuery =
      viewerId === undefined
        ? `
      WITH distinct_sources AS (
        SELECT DISTINCT ON (es.url) es.id, es.url, es.title, es.created_at, es.post_id AS "postId"
        FROM external_sources es
        INNER JOIN collection_items ci ON ci.post_id = es.post_id
        INNER JOIN posts p ON p.id = es.post_id AND p.deleted_at IS NULL
        ${publicClause}
        WHERE ci.collection_id = $1
        ORDER BY es.url, es.created_at DESC
      )
      SELECT id, url, title, created_at AS "createdAt", "postId" FROM distinct_sources ORDER BY "createdAt" DESC
      `
        : `
      WITH distinct_sources AS (
        SELECT DISTINCT ON (es.url) es.id, es.url, es.title, es.created_at, es.post_id AS "postId"
        FROM external_sources es
        INNER JOIN collection_items ci ON ci.post_id = es.post_id
        INNER JOIN posts p ON p.id = es.post_id AND p.deleted_at IS NULL
        WHERE ci.collection_id = $1 AND es.post_id = ANY($2::uuid[])
        ORDER BY es.url, es.created_at DESC
      )
      SELECT id, url, title, created_at AS "createdAt", "postId" FROM distinct_sources ORDER BY "createdAt" DESC
      `;
    const extParams =
      viewerId === undefined
        ? [collectionId]
        : [collectionId, [...visiblePostIds]];
    const extRows = (await this.externalSourceRepo.query(
      extQuery,
      extParams,
    )) as ExtRow[];
    const externalItems: CollectionSourceItem[] = extRows.map(
      (r) => ({
        type: 'external',
        id: r.id,
        url: r.url,
        title: r.title,
        createdAt: r.createdAt,
      }),
    );

    // 3) Linked posts (LINK edges from visible collection posts)
    const edges = await this.postEdgeRepo.find({
      where: {
        fromPostId: In([...visiblePostIds]),
        edgeType: EdgeType.LINK,
      },
      relations: ['toPost', 'toPost.author'],
      order: { createdAt: 'DESC' },
    });
    const toPostIds = [...new Set(edges.map((e) => e.toPostId))];
    const toPosts = await this.postRepo.find({
      where: { id: In(toPostIds) },
      relations: ['author'],
      select: ['id', 'title', 'createdAt', 'headerImageKey', 'authorId'],
    });
    const visibleToPosts = await this.exploreService.filterPostsVisibleToViewer(
      toPosts,
      viewerId,
    );
    const visibleToPostIds = new Set(visibleToPosts.map((p) => p.id));
    const authorHandles = new Map<string, string>();
    for (const p of visibleToPosts) {
      if (p.author?.handle) authorHandles.set(p.id, p.author.handle);
    }
    const postItems: CollectionSourceItem[] = [];
    const seenPostIds = new Set<string>();
    for (const e of edges) {
      if (!visibleToPostIds.has(e.toPostId) || seenPostIds.has(e.toPostId))
        continue;
      seenPostIds.add(e.toPostId);
      const post = e.toPost;
      if (!post) continue;
      postItems.push({
        type: 'post',
        id: post.id,
        title: post.title ?? null,
        createdAt: e.createdAt,
        headerImageKey: post.headerImageKey ?? null,
        authorHandle: authorHandles.get(post.id) ?? null,
      });
    }

    // 4) Topics tagged on visible collection posts
    const topicLinks = await this.postTopicRepo
      .createQueryBuilder('pt')
      .select('pt.topic_id', 'topicId')
      .where('pt.post_id IN (:...postIds)', {
        postIds: [...visiblePostIds],
      })
      .groupBy('pt.topic_id')
      .getRawMany<{ topicId: string }>();
    const topicIds = topicLinks.map((r) => r.topicId);
    const topics =
      topicIds.length === 0
        ? []
        : await this.topicRepo.find({
          where: { id: In(topicIds) },
          select: ['id', 'slug', 'title', 'createdAt'],
        });
    const topicItems: CollectionSourceItem[] = topics.map((t) => ({
      type: 'topic',
      id: t.id,
      slug: t.slug,
      title: t.title,
      createdAt: t.createdAt,
    }));

    // 5) Merge, sort by createdAt desc, dedupe, paginate
    const merged: CollectionSourceItem[] = [
      ...externalItems,
      ...postItems,
      ...topicItems,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const seen = new Set<string>();
    const deduped = merged.filter((item) => {
      const key =
        item.type === 'external'
          ? `ext:${item.url}`
          : `${item.type}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return deduped.slice(offset, offset + limit);
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
      avatarKey: string | null;
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
      .addSelect('author.avatar_key', 'avatarKey')
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
      .addGroupBy('author.avatar_key')
      .orderBy('"totalQuotes"', 'DESC')
      .addOrderBy('"postCount"', 'DESC')
      .limit(fetchLimit)
      .offset(offset);

    const raw = await builder.getRawMany<{
      id: string;
      handle: string;
      displayName: string;
      avatarKey: string | null;
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
      avatarKey: r.avatarKey ?? null,
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
