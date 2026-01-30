import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Collection } from '../entities/collection.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private collectionRepo: Repository<Collection>,
    @InjectRepository(CollectionItem)
    private itemRepo: Repository<CollectionItem>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async create(
    userId: string,
    title: string,
    description?: string,
    shareSaves = false,
  ) {
    const col = this.collectionRepo.create({
      ownerId: userId,
      title,
      description,
      isPublic: true, // visibility follows user profile; column kept for compatibility
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
    const previewMap = await this.getPreviewImageKeys(ids);
    return collections.map((c) => ({
      ...c,
      previewImageKey: previewMap[c.id] ?? null,
    }));
  }

  /** One random post header image key per collection (for list previews). */
  async getPreviewImageKeys(
    collectionIds: string[],
  ): Promise<Record<string, string>> {
    if (collectionIds.length === 0) return {};
    const items = await this.itemRepo.find({
      where: { collectionId: In(collectionIds) },
      relations: ['post'],
      select: ['id', 'collectionId'],
    });
    const byCollection = new Map<
      string,
      { postId: string; headerImageKey: string | null }[]
    >();
    for (const item of items) {
      const key = item.post?.headerImageKey ?? null;
      if (!key) continue;
      const list = byCollection.get(item.collectionId) ?? [];
      list.push({ postId: item.post?.id, headerImageKey: key });
      byCollection.set(item.collectionId, list);
    }
    const out: Record<string, string> = {};
    for (const [cid, list] of byCollection) {
      if (list.length > 0) {
        const random = list[Math.floor(Math.random() * list.length)];
        if (random?.headerImageKey) out[cid] = random.headerImageKey;
      }
    }
    return out;
  }

  async findOne(id: string, userId: string) {
    const collection = await this.collectionRepo.findOne({
      where: { id, ownerId: userId },
    });
    if (!collection) {
      throw new Error('Collection not found');
    }

    const items = await this.itemRepo.find({
      where: { collectionId: id },
      relations: ['post', 'post.author'],
      order: { addedAt: 'DESC' },
    });

    return { ...collection, items };
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
