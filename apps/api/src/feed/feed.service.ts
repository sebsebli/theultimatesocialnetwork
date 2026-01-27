import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Follow } from '../entities/follow.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Collection } from '../entities/collection.entity';
import { User } from '../entities/user.entity';
import { FeedItem } from './feed-item.entity';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(CollectionItem)
    private collectionItemRepo: Repository<CollectionItem>,
    @InjectRepository(Collection)
    private collectionRepo: Repository<Collection>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getHomeFeed(
    userId: string,
    limit = 20,
    offset = 0,
    includeSavedBy = false,
  ): Promise<FeedItem[]> {
    // Basic chronological feed: Posts from people I follow
    const follows = await this.followRepo.find({
      where: { followerId: userId },
    });
    const followingIds = follows.map((f) => f.followeeId);

    // Always include self
    followingIds.push(userId);

    if (followingIds.length === 0) return [];

    // Get posts from followed users and own posts (excluding deleted)
    // Optimization: Filter directly in DB to avoid over-fetching
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.deleted_at IS NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('post.author_id = :userId', { userId }).orWhere(
            'post.author_id IN (:...followingIds) AND post.visibility = :visVal',
            {
              followingIds:
                followingIds.length > 0
                  ? followingIds
                  : ['00000000-0000-0000-0000-000000000000'],
              visVal: 'PUBLIC',
            },
          );
        }),
      )
      .orderBy('post.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    const feedItems: FeedItem[] = posts.map((post) => ({
      type: 'post',
      data: post,
    }));

    // Add "Saved by X" items if enabled
    if (includeSavedBy) {
      // Get recent collection items from people I follow
      const recentSaves = await this.collectionItemRepo
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.collection', 'collection')
        .leftJoinAndSelect('item.post', 'post')
        .leftJoinAndSelect('post.author', 'postAuthor')
        .leftJoinAndSelect('collection.owner', 'saver') // Join saver directly
        .where('collection.owner_id IN (:...ids)', { ids: followingIds })
        .andWhere('collection.is_public = true')
        .andWhere('collection.share_saves = true') // Respect privacy
        .andWhere('item.added_at >= :since', {
          since: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
        .orderBy('item.added_at', 'DESC')
        .limit(10)
        .getMany();

      for (const save of recentSaves) {
        if (save.collection.owner) {
          feedItems.push({
            type: 'saved_by',
            data: {
              userId: save.collection.owner.id,
              userName:
                save.collection.owner.displayName ||
                save.collection.owner.handle,
              collectionId: save.collection.id,
              collectionName: save.collection.title,
              post: save.post,
            },
          });
        }
      }
    }

    // Sort by timestamp (most recent first)
    feedItems.sort((a, b) => {
      const aTime =
        a.type === 'post'
          ? (a.data.createdAt ?? new Date(0))
          : (a.data.post?.createdAt ?? new Date(0));
      const bTime =
        b.type === 'post'
          ? (b.data.createdAt ?? new Date(0))
          : (b.data.post?.createdAt ?? new Date(0));
      return bTime.getTime() - aTime.getTime();
    });

    return feedItems.slice(0, limit);
  }
}
