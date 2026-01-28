import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Follow } from '../entities/follow.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Collection } from '../entities/collection.entity';
import { User } from '../entities/user.entity';
import { Block } from '../entities/block.entity';
import { Mute } from '../entities/mute.entity';
import { FeedItem } from './feed-item.entity';
import { postToPlain } from '../shared/post-serializer';
import Redis from 'ioredis';

/** Return plain objects so the response is guaranteed JSON-serializable. */
function toPlainFeedItems(items: FeedItem[]): unknown[] {
  return items
    .map((item) => {
      if (item.type === 'post') {
        const data = postToPlain(item.data);
        return data ? { type: 'post' as const, data } : null;
      }
      const d = item.data;
      return {
        type: 'saved_by' as const,
        data: {
          userId: d.userId ?? '',
          userName: d.userName ?? '',
          collectionId: d.collectionId ?? '',
          collectionName: d.collectionName ?? '',
          post: d.post ? postToPlain(d.post) : undefined,
        },
      };
    })
    .filter(Boolean);
}

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
    @InjectRepository(Block) private blockRepo: Repository<Block>,
    @InjectRepository(Mute) private muteRepo: Repository<Mute>,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async getHomeFeed(
    userId: string,
    limit = 20,
    offset = 0,
    includeSavedBy = false,
  ): Promise<FeedItem[]> {
    // Get blocked and muted users to exclude
    const [blocks, mutes] = await Promise.all([
      this.blockRepo.find({
        where: [{ blockerId: userId }, { blockedId: userId }],
      }),
      this.muteRepo.find({ where: { muterId: userId } }),
    ]);

    const excludedUserIds = new Set<string>();
    blocks.forEach((b) => {
      excludedUserIds.add(b.blockerId === userId ? b.blockedId : b.blockerId);
    });
    mutes.forEach((m) => excludedUserIds.add(m.mutedId));

    // Basic chronological feed: Posts from people I follow
    const follows = await this.followRepo.find({
      where: { followerId: userId },
    });
    const followingIds = follows
      .map((f) => f.followeeId)
      .filter((id) => !excludedUserIds.has(id));

    // Always include self
    followingIds.push(userId);

    if (followingIds.length === 0) return [];

    let feedItems: FeedItem[] = [];
    let usedCache = false;

    // 1. Try Redis Cache (Fan-out Read) for recent posts
    if (offset < 500) {
      try {
        const cacheKey = `feed:${userId}`;
        const cachedIds = await this.redis.lrange(
          cacheKey,
          offset,
          offset + limit - 1,
        );

        if (cachedIds.length > 0) {
          const posts = await this.postRepo.find({
            where: { id: In(cachedIds) },
            relations: ['author'],
          });

          // Maintain order from Redis list
          const postMap = new Map(posts.map((p) => [p.id, p]));
          const orderedPosts = cachedIds
            .map((id) => postMap.get(id))
            .filter((p): p is Post => !!p && !p.deletedAt); // Filter deleted

          if (orderedPosts.length > 0) {
            feedItems = orderedPosts.map((post) => ({
              type: 'post',
              data: post,
            }));
            usedCache = true;
          }
        }
      } catch (e) {
        console.warn('Feed cache read failed', e);
      }
    }

    // 2. DB Fallback (Pull Model) if cache miss or empty
    if (!usedCache) {
      const posts = await this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .andWhere('post.author_id NOT IN (:...excluded)', {
          excluded:
            excludedUserIds.size > 0
              ? Array.from(excludedUserIds)
              : ['00000000-0000-0000-0000-000000000000'],
        })
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

      feedItems = posts.map((post) => ({
        type: 'post',
        data: post,
      }));
    }

    // Add "Saved by X" items if enabled (Interleave)
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
        if (save.collection?.owner && save.post) {
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

    // Sort by timestamp (most recent first) — coerce to Date so .getTime() is safe (DB may return string)
    feedItems.sort((a, b) => {
      const aTs =
        a.type === 'post'
          ? new Date(a.data.createdAt ?? 0).getTime()
          : new Date(a.data.post?.createdAt ?? 0).getTime();
      const bTs =
        b.type === 'post'
          ? new Date(b.data.createdAt ?? 0).getTime()
          : new Date(b.data.post?.createdAt ?? 0).getTime();
      return bTs - aTs;
    });

    // Re-slice because adding "Saved By" might exceed limit
    const trimmed = feedItems.slice(0, limit);
    return toPlainFeedItems(trimmed) as FeedItem[];
  }
}
