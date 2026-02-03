import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Collection } from '../entities/collection.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';

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
    const latestMap = await this.getLatestItemPreview(ids);
    return collections.map((c) => {
      const latest = latestMap[c.id];
      return {
        ...c,
        previewImageKey: latest?.headerImageKey ?? null,
        recentPost: latest
          ? {
              id: latest.postId,
              title: latest.title ?? null,
              bodyExcerpt: latest.bodyExcerpt ?? null,
              headerImageKey: latest.headerImageKey ?? null,
            }
          : null,
      };
    });
  }

  /** Latest added item per collection (by addedAt DESC). Public for use by users service. */
  async getLatestItemPreview(collectionIds: string[]): Promise<
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
    for (const item of items) {
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

  async findOne(id: string, userId: string, limit?: number, offset?: number) {
    const collection = await this.collectionRepo.findOne({
      where: { id, ownerId: userId },
    });
    if (!collection) {
      throw new Error('Collection not found');
    }

    if (limit != null && offset != null) {
      const { items, hasMore } = await this.getItemsPage(id, limit, offset);
      return { ...collection, items, hasMore };
    }

    const items = await this.itemRepo.find({
      where: { collectionId: id },
      relations: ['post', 'post.author'],
      order: { addedAt: 'DESC' },
    });

    return { ...collection, items };
  }

  /** Paginated items for a collection. Caller must ensure viewer has access. */
  async getItemsPage(
    collectionId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: CollectionItem[]; hasMore: boolean }> {
    const items = await this.itemRepo.find({
      where: { collectionId: collectionId },
      relations: ['post', 'post.author'],
      order: { addedAt: 'DESC' },
      take: limit + 1,
      skip: offset,
    });
    const hasMore = items.length > limit;
    const slice = hasMore ? items.slice(0, limit) : items;
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
    if (limit != null && offset != null) {
      const { items, hasMore } = await this.getItemsPage(
        collectionId,
        limit,
        offset,
      );
      return { ...collection, items, hasMore };
    }
    return this.findOne(collectionId, collection.ownerId);
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
