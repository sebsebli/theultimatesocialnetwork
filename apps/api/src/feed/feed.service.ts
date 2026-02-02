import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Follow } from '../entities/follow.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Collection } from '../entities/collection.entity';
import { User } from '../entities/user.entity';
import { Block } from '../entities/block.entity';
import { Mute } from '../entities/mute.entity';
import { TopicFollow } from '../entities/topic-follow.entity';
import { FeedItem } from './feed-item.entity';
import { postToPlain, extractLinkedPostIds } from '../shared/post-serializer';
import type { ReferenceMetadata } from '../shared/post-serializer';
import { UploadService } from '../upload/upload.service';
import Redis from 'ioredis';

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

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
    @InjectRepository(TopicFollow)
    private topicFollowRepo: Repository<TopicFollow>,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private uploadService: UploadService,
  ) {}

  async getHomeFeed(
    userId: string,
    limit = 20,
    offset = 0,
    includeSavedBy = false,
    cursor?: string,
  ): Promise<{ items: FeedItem[]; nextCursor?: string }> {
    try {
      return await this.getHomeFeedInternal(
        userId,
        limit,
        offset,
        includeSavedBy,
        cursor,
      );
    } catch (err) {
      this.logger.error(
        `Feed load failed for user ${userId}`,
        err instanceof Error ? err.stack : String(err),
      );
      return { items: [] };
    }
  }

  private async getHomeFeedInternal(
    userId: string,
    limit = 20,
    offset = 0,
    includeSavedBy = false,
    cursor?: string,
  ): Promise<{ items: FeedItem[]; nextCursor?: string }> {
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

    // Also get followed topics
    const topicFollows = await this.topicFollowRepo.find({
      where: { userId },
      select: ['topicId'],
    });
    const followedTopicIds = topicFollows.map((f) => f.topicId);

    // Always include self
    followingIds.push(userId);

    // If following no one and no topics, return empty (or could return global feed? No, definition is follow-only)
    if (followingIds.length === 0 && followedTopicIds.length === 0)
      return { items: [] };

    let feedItems: FeedItem[] = [];
    let usedCache = false;
    let nextCursorResult: string | undefined;

    // 1. Try Redis Cache (Fan-out Read) for recent posts (only when no cursor — cursor implies DB for deep pagination)
    // Note: Redis feed usually only stores USER follows push model. Topic follows usually pull model.
    // If we want mixed feed, we likely skip cache if we have topics, or we need to merge.
    // For now, let's skip cache if we have topic follows, or assume cache only has user feed and we need DB for topics.
    // Simplest robust way: Use DB fallback if topics are followed, OR just use DB for now for topics.
    // Given the request "So when following a topic, I see the newest posts on homescreen", let's prioritize correctness over cache for now.
    // If topic follows exist, force DB pull (or implementing complex merge).
    // Let's force DB pull if topic follows exist to ensure they appear.

    if (!cursor && offset < 500 && followedTopicIds.length === 0) {
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

    // 2. DB Fallback (Pull Model) if cache miss or empty (or if we have topics)
    // Cursor-based: when cursor is provided (ISO date), use WHERE created_at < cursor for stable deep pagination
    if (!usedCache) {
      const query = this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.deleted_at IS NULL')
        .andWhere("post.status = 'PUBLISHED'")
        .andWhere('post.author_id NOT IN (:...excluded)', {
          excluded:
            excludedUserIds.size > 0
              ? Array.from(excludedUserIds)
              : ['00000000-0000-0000-0000-000000000000'],
        });

      query.andWhere(
        new Brackets((qb) => {
          // Posts by followed users (or self)
          qb.where('post.author_id = :userId', { userId }).orWhere(
            'post.author_id IN (:...followingIds)',
            {
              followingIds:
                followingIds.length > 0
                  ? followingIds
                  : ['00000000-0000-0000-0000-000000000000'],
            },
          );

          // OR Posts in followed topics
          if (followedTopicIds.length > 0) {
            qb.orWhere(
              `EXISTS (SELECT 1 FROM post_topics pt WHERE pt.post_id = post.id AND pt.topic_id = ANY(:followedTopicIds))`,
              { followedTopicIds },
            );
          }
        }),
      );

      if (cursor) {
        const cursorDate = new Date(cursor);
        if (!Number.isNaN(cursorDate.getTime())) {
          query.andWhere('post.created_at < :cursor', { cursor: cursorDate });
        }
      }

      const posts = await query
        .orderBy('post.created_at', 'DESC')
        .skip(cursor ? 0 : offset)
        .take(limit + 1) // always fetch one extra to know if there's a next page and to return nextCursor
        .getMany();

      const hasMore = posts.length > limit;
      const slice = hasMore ? posts.slice(0, limit) : posts;
      const last = slice[slice.length - 1];
      nextCursorResult =
        hasMore && last?.createdAt ? last.createdAt.toISOString() : undefined;

      feedItems = slice.map((post) => ({
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
    const items = (await this.toPlainFeedItems(trimmed)) as FeedItem[];
    return { items, nextCursor: nextCursorResult };
  }

  /** Return plain objects with avatarUrl/headerImageUrl and referenceMetadata for linked post titles. */
  private async toPlainFeedItems(items: FeedItem[]): Promise<unknown[]> {
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const posts: Post[] = [];
    for (const item of items) {
      if (item.type === 'post') posts.push(item.data);
      else if (item.data.post) posts.push(item.data.post);
    }
    const allLinkedIds = new Set<string>();
    const postToLinkedIds = new Map<string, string[]>();
    for (const p of posts) {
      const ids = extractLinkedPostIds(p.body);
      postToLinkedIds.set(p.id, ids);
      ids.forEach((id) => allLinkedIds.add(id));
    }
    let titlesMap: Record<string, { title?: string }> = {};
    if (allLinkedIds.size > 0) {
      const refs = await this.postRepo.find({
        where: Array.from(allLinkedIds).map((id) => ({ id })),
        select: ['id', 'title'],
      });
      titlesMap = Object.fromEntries(
        refs.map((r) => [
          (r.id ?? '').toLowerCase(),
          { title: r.title ?? undefined },
        ]),
      ) as ReferenceMetadata;
    }
    const getRefMeta = (ids: string[] | undefined) =>
      ids?.reduce(
        (acc, id) => ({
          ...acc,
          [id]: titlesMap[(id ?? '').toLowerCase()] ?? {},
        }),
        {} as ReferenceMetadata,
      );
    return items
      .map((item) => {
        if (item.type === 'post') {
          const refMeta = getRefMeta(postToLinkedIds.get(item.data.id));
          const data = postToPlain(item.data, getImageUrl, refMeta);
          return data ? { type: 'post' as const, data } : null;
        }
        const d = item.data;
        const refMeta = d.post
          ? getRefMeta(postToLinkedIds.get(d.post.id))
          : undefined;
        return {
          type: 'saved_by' as const,
          data: {
            userId: d.userId ?? '',
            userName: d.userName ?? '',
            collectionId: d.collectionId ?? '',
            collectionName: d.collectionName ?? '',
            post: d.post
              ? postToPlain(d.post, getImageUrl, refMeta)
              : undefined,
          },
        };
      })
      .filter(Boolean);
  }
}
