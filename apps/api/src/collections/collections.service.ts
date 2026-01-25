import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from '../entities/collection.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection) private collectionRepo: Repository<Collection>,
    @InjectRepository(CollectionItem) private itemRepo: Repository<CollectionItem>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async create(userId: string, title: string, description?: string, isPublic = false, shareSaves = false) {
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
    return this.collectionRepo.find({
      where: { ownerId: userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    }).then(collections => 
      collections.map(c => ({
        ...c,
        itemCount: c.items?.length || 0,
      }))
    );
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

  async update(id: string, userId: string, dto: { shareSaves?: boolean; title?: string; description?: string; isPublic?: boolean }) {
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

  async removeItem(collectionId: string, itemId: string, userId: string) {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId, ownerId: userId },
    });
    if (!collection) {
      throw new Error('Collection not found');
    }

    await this.itemRepo.delete({ id: itemId, collectionId });
  }
}