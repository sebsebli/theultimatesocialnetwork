import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keep } from '../entities/keep.entity';
import { Post } from '../entities/post.entity';
import { CollectionItem } from '../entities/collection-item.entity';

@Injectable()
export class KeepsService {
  constructor(
    @InjectRepository(Keep) private keepRepo: Repository<Keep>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(CollectionItem)
    private collectionItemRepo: Repository<CollectionItem>,
  ) {}

  async getAll(
    userId: string,
    filters?: {
      search?: string;
      inCollection?: boolean;
      page?: number;
      limit?: number;
    },
  ): Promise<{ items: Keep[]; hasMore: boolean }> {
    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 50));
    const skip = (page - 1) * limit;

    let query = this.keepRepo
      .createQueryBuilder('keep')
      .leftJoinAndSelect('keep.post', 'post')
      .leftJoinAndSelect('post.author', 'author')
      .where('keep.userId = :userId', { userId })
      .orderBy('keep.createdAt', 'DESC');

    if (filters?.search) {
      query = query.andWhere(
        '(post.body ILIKE :search OR post.title ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.inCollection !== undefined) {
      if (filters.inCollection) {
        query = query
          .leftJoin('collection_items', 'item', 'item.post_id = post.id')
          .andWhere('item.id IS NOT NULL');
      } else {
        query = query
          .leftJoin('collection_items', 'item', 'item.post_id = post.id')
          .andWhere('item.id IS NULL');
      }
    }

    query = query.skip(skip).take(limit + 1);
    const keeps = await query.getMany();
    const items = keeps.slice(0, limit);
    const hasMore = keeps.length > limit;
    return { items, hasMore };
  }
}
