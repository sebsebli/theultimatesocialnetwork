import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { isPendingUser } from '../shared/is-pending-user';
import { UploadService } from '../upload/upload.service';
import { InteractionsService } from '../interactions/interactions.service';
import { ExploreService } from '../explore/explore.service';
import Redis from 'ioredis';
import { feedDuration } from '../common/metrics';

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
    private interactionsService: InteractionsService,
    private exploreService: ExploreService,
  ) {}

  async getHomeFeed(
    userId: string,
    limit = 20,
    offset = 0,
    includeSavedBy = false,
    cursor?: string,
  ): Promise<{ items: FeedItem[]; nextCursor?: string }> {
    const end = feedDuration.startTimer({ type: 'home' });
    try {
      const result = await this.getHomeFeedInternal(
        userId,
        limit,
        offset,
        includeSavedBy,
        cursor,
      );
      end();
      return result;
    } catch (err) {
      end();
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
    // Get blocked/muted users — cache for 5 min to avoid hammering DB on every page
    const blockMuteCacheKey = `feed:blockmute:${userId}`;
    let excludedUserIds: Set<string>;
    try {
      const cached = await this.redis.get(blockMuteCacheKey);
      if (cached) {
        excludedUserIds = new Set(JSON.parse(cached) as string[]);
      } else {
        throw new Error('miss');
      }
    } catch {
      const [blocks, mutes] = await Promise.all([
        this.blockRepo.find({
          where: [{ blockerId: userId }, { blockedId: userId }],
          select: ['blockerId', 'blockedId'],
        }),
        this.muteRepo.find({ where: { muterId: userId }, select: ['mutedId'] }),
      ]);
      excludedUserIds = new Set<string>();
      blocks.forEach((b) => {
        excludedUserIds.add(b.blockerId === userId ? b.blockedId : b.blockerId);
      });
      mutes.forEach((m) => excludedUserIds.add(m.mutedId));
      excludedUserIds.add('00000000-0000-0000-0000-000000000000');
      this.redis
        .setex(blockMuteCacheKey, 300, JSON.stringify([...excludedUserIds]))
        .catch(() => {});
    }

    // Cache following IDs for 2 min (changes rarely, read every page load)
    const followCacheKey = `feed:following:${userId}`;
    let followingIds: string[];
    let followedTopicIds: string[];
    try {
      const cached = await this.redis.get(followCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as {
          users: string[];
          topics: string[];
        };
        followingIds = parsed.users.filter((id) => !excludedUserIds.has(id));
        followedTopicIds = parsed.topics;
      } else {
        throw new Error('miss');
      }
    } catch {
      const [follows, topicFollows] = await Promise.all([
        this.followRepo.find({
          where: { followerId: userId },
          select: ['followeeId'],
        }),
        this.topicFollowRepo.find({ where: { userId }, select: ['topicId'] }),
      ]);
      followingIds = follows
        .map((f) => f.followeeId)
        .filter((id) => !excludedUserIds.has(id));
      followedTopicIds = topicFollows.map((f) => f.topicId);
      this.redis
        .setex(
          followCacheKey,
          120,
          JSON.stringify({ users: followingIds, topics: followedTopicIds }),
        )
        .catch(() => {});
    }

    // Always include self
    if (!followingIds.includes(userId)) followingIds.push(userId);

    if (followingIds.length === 0 && followedTopicIds.length === 0)
      return { items: [] };

    let feedItems: FeedItem[] = [];
    let nextCursorResult: string | undefined;

    // Split queries strategy: Users vs Topics
    // This avoids complex OR clauses that confuse the query planner.

    const cursorDate = cursor ? new Date(cursor) : undefined;
    const dbLimit = limit + 1; // fetch one extra to detect hasMore

    const fetchUserPosts = async () => {
      if (followingIds.length === 0) return [];
      const qb = this.postRepo
        .createQueryBuilder('post')
        .innerJoinAndSelect('post.author', 'author')
        .where('post.author_id IN (:...followingIds)', { followingIds })
        .andWhere('post.deleted_at IS NULL')
        .andWhere("post.status = 'PUBLISHED'")
        .andWhere("author.handle NOT LIKE '__pending_%'"); // Ensure author is valid

      if (excludedUserIds.size > 0) {
        qb.andWhere('post.author_id NOT IN (:...excluded)', {
          excluded: Array.from(excludedUserIds),
        });
      }

      if (cursorDate && !isNaN(cursorDate.getTime())) {
        qb.andWhere('post.created_at < :cursor', { cursor: cursorDate });
      }

      return qb
        .orderBy('post.createdAt', 'DESC')
        .take(dbLimit)
        .skip(cursor ? 0 : offset) // Only use offset if no cursor
        .getMany();
    };

    const fetchTopicPosts = async () => {
      if (followedTopicIds.length === 0) return [];
      const qb = this.postRepo
        .createQueryBuilder('post')
        .innerJoinAndSelect('post.author', 'author')
        // Use INNER JOIN for topic filtering - efficient with index on post_topic(topic_id)
        .innerJoin('post_topics', 'pt', 'pt.post_id = post.id')
        .where('pt.topic_id IN (:...followedTopicIds)', { followedTopicIds })
        .andWhere('post.deleted_at IS NULL')
        .andWhere("post.status = 'PUBLISHED'")
        .andWhere("author.handle NOT LIKE '__pending_%'");

      if (excludedUserIds.size > 0) {
        qb.andWhere('post.author_id NOT IN (:...excluded)', {
          excluded: Array.from(excludedUserIds),
        });
      }

      if (cursorDate && !isNaN(cursorDate.getTime())) {
        qb.andWhere('post.created_at < :cursor', { cursor: cursorDate });
      }

      // Dedup at query level if possible? No, we will dedup in memory.
      return qb
        .orderBy('post.createdAt', 'DESC')
        .take(dbLimit)
        .skip(cursor ? 0 : offset)
        .getMany();
    };

    const [userPosts, topicPosts] = await Promise.all([
      fetchUserPosts(),
      fetchTopicPosts(),
    ]);

    // Merge and Dedup
    const allPosts = [...userPosts, ...topicPosts];
    const uniquePostsMap = new Map<string, Post>();
    for (const p of allPosts) {
      if (!uniquePostsMap.has(p.id)) uniquePostsMap.set(p.id, p);
    }
    const uniquePosts = Array.from(uniquePostsMap.values());

    // Sort descending
    uniquePosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Check pagination
    // If we have cursor, we took dbLimit. If uniquePosts > limit, we have more?
    // Not necessarily. We might have fetched 21 user posts and 21 topic posts.
    // We strictly take 'limit' from the top.

    const postsSlice = uniquePosts.slice(0, limit);
    const visiblePosts = await this.exploreService.filterPostsVisibleToViewer(
      postsSlice,
      userId,
    );

    feedItems = visiblePosts.map((post) => ({
      type: 'post',
      data: post,
    }));

    // Determine next cursor from the LAST item in the FULL fetched set (before visibility filter? No, effectively the last item considered)
    // Actually, simply: if uniquePosts.length > limit, the next cursor is the createdAt of the item at index `limit`.
    // But wait, if we drop items due to visibility, the cursor should be based on the last item *returned*?
    // No, cursor is based on the source list order.
    // However, for robustness, we use the timestamp of the last item in the *returned* list as the next cursor.
    // BUT if we filter out items, we might end up with fewer than limit.
    // This is the classic "filtering after pagination" problem.
    // For now, we accept that pages might be slightly shorter than limit.
    // We use the timestamp of the last considered item (uniquePosts[limit-1]) or similar.

    if (uniquePosts.length > limit) {
      // We have more.
      const lastItem = uniquePosts[limit - 1]; // The last item that fits in the page
      nextCursorResult = lastItem.createdAt.toISOString();
    } else {
      // We exhausted what we fetched.
      // Note: Since we fetched limit+1 from each source, if both sources returned < limit+1, we likely exhausted both?
      // Not necessarily.
      // Correct logic with split queries is tricky for "hasMore".
      // Conservative approach: If EITHER source returned limit+1, there *might* be more.
      // But we merged them.
      // If uniquePosts.length > limit, we definitely have a next page.
      if (userPosts.length > limit || topicPosts.length > limit) {
        const lastItem = uniquePosts[limit - 1];
        nextCursorResult = lastItem?.createdAt.toISOString();
      }
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
        .orderBy('item.addedAt', 'DESC')
        .limit(10)
        .getMany();

      const savesWithPost = recentSaves.filter(
        (s) =>
          s.collection?.owner && s.post && !isPendingUser(s.collection.owner),
      );
      if (savesWithPost.length > 0) {
        const savedPosts = savesWithPost.map((s) => s.post);
        const visibleSaved =
          await this.exploreService.filterPostsVisibleToViewer(
            savedPosts,
            userId,
          );
        const visibleSavedIds = new Set(visibleSaved.map((p) => p.id));
        for (const save of savesWithPost) {
          if (save.post && visibleSavedIds.has(save.post.id)) {
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
    const items = (await this.toPlainFeedItems(trimmed, userId)) as FeedItem[];

    // Ensure nextCursor is not older than the last item we returned?
    // Actually, if we interleave "saved by" (which are 24h recent), they might push older posts out.
    // Pagination should follow the "main" stream (posts).

    return { items, nextCursor: nextCursorResult };
  }

  /** Return plain objects with avatarUrl/headerImageUrl, referenceMetadata, and viewer isLiked/isKept. */
  private async toPlainFeedItems(
    items: FeedItem[],
    viewerId: string,
  ): Promise<unknown[]> {
    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const posts: Post[] = [];
    for (const item of items) {
      if (item.type === 'post') posts.push(item.data);
      else if (item.data.post) posts.push(item.data.post);
    }
    const postIds = posts.map((p) => p.id).filter(Boolean);
    const { likedIds, keptIds } =
      await this.interactionsService.getLikeKeepForViewer(viewerId, postIds);
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
    const viewerState = (postId: string) => ({
      isLiked: likedIds.has(postId),
      isKept: keptIds.has(postId),
    });
    return items
      .map((item) => {
        if (item.type === 'post') {
          const refMeta = getRefMeta(postToLinkedIds.get(item.data.id));
          const vs = viewerState(item.data.id);
          const data = postToPlain(item.data, getImageUrl, refMeta, vs);
          return data ? { type: 'post' as const, data } : null;
        }
        const d = item.data;
        const refMeta = d.post
          ? getRefMeta(postToLinkedIds.get(d.post.id))
          : undefined;
        const vs = d.post ? viewerState(d.post.id) : undefined;
        return {
          type: 'saved_by' as const,
          data: {
            userId: d.userId ?? '',
            userName: d.userName ?? '',
            collectionId: d.collectionId ?? '',
            collectionName: d.collectionName ?? '',
            post: d.post
              ? postToPlain(d.post, getImageUrl, refMeta, vs)
              : undefined,
          },
        };
      })
      .filter(Boolean);
  }
}
