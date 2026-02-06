import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../entities/follow.entity';
import { User } from '../entities/user.entity';
import Redis from 'ioredis';

/**
 * FeedFanoutService — Hybrid push/pull feed distribution.
 *
 * ## Strategy (Twitter/Instagram pattern):
 *
 * - **Push-on-write** (< CELEBRITY_THRESHOLD followers):
 *   When a normal user publishes a post, push the postId into each
 *   follower's Redis feed list immediately. Fast for reads.
 *
 * - **Pull-on-read** (>= CELEBRITY_THRESHOLD followers):
 *   When a "celebrity" user posts, do NOT fan out. Instead, at read time,
 *   merge the celebrity's recent posts into the follower's feed.
 *   This avoids writing to millions of Redis keys on a single publish.
 *
 * ## Scaling path:
 *   - 0–100K users: Push only (current). Simple, fast reads.
 *   - 100K–1M users: Hybrid. Top 0.1% users are pull-on-read.
 *   - 1M+ users: Hybrid + sharded Redis. Feed keys distributed across cluster.
 *
 * ## Redis key schema:
 *   feed:{userId}         — Push-based feed (list of postIds, max 500)
 *   feed:author:{userId}  — Author's recent posts (for pull, max 100)
 *   feed:celebrities       — Set of userId's with > threshold followers
 */
@Injectable()
export class FeedFanoutService {
  private readonly logger = new Logger(FeedFanoutService.name);

  /**
   * Follower threshold above which we switch to pull-on-read.
   * Configurable via FEED_CELEBRITY_THRESHOLD env var.
   */
  private readonly CELEBRITY_THRESHOLD: number;

  /** Max posts in a user's push feed. */
  private readonly MAX_FEED_SIZE = 500;

  /** Max recent posts stored for celebrity pull feeds. */
  private readonly MAX_AUTHOR_FEED = 100;

  /** TTL for celebrity author feeds (24 hours). */
  private readonly AUTHOR_FEED_TTL = 86400;

  constructor(
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {
    const threshold = parseInt(
      process.env.FEED_CELEBRITY_THRESHOLD || '10000',
      10,
    );
    this.CELEBRITY_THRESHOLD = isNaN(threshold) ? 10000 : threshold;
    this.logger.log(
      `Feed fanout: hybrid mode (celebrity threshold: ${this.CELEBRITY_THRESHOLD} followers).`,
    );
  }

  /**
   * Fan out a new post to followers.
   * Called from the post worker after a post is published.
   *
   * @returns Number of feed entries written (0 for celebrity posts)
   */
  async fanOutPost(postId: string, authorId: string): Promise<number> {
    // Check author's follower count
    const author = await this.userRepo.findOne({
      where: { id: authorId },
      select: ['id', 'followerCount'],
    });

    const followerCount = author?.followerCount ?? 0;

    // Always update the author's recent posts feed (used for pull-on-read)
    await this.updateAuthorFeed(authorId, postId);

    // Celebrity path: don't fan out, mark as celebrity
    if (followerCount >= this.CELEBRITY_THRESHOLD) {
      await this.redis.sadd('feed:celebrities', authorId);
      this.logger.debug(
        `Post ${postId} by celebrity ${authorId} (${followerCount} followers): pull-on-read, skipping fanout.`,
      );
      return 0;
    }

    // Normal path: push to each follower's feed
    const BATCH_SIZE = 1000;
    let page = 0;
    let totalWritten = 0;
    let followers: Follow[];

    do {
      followers = await this.followRepo.find({
        where: { followeeId: authorId },
        select: ['followerId'],
        take: BATCH_SIZE,
        skip: page * BATCH_SIZE,
      });

      if (followers.length > 0) {
        const pipeline = this.redis.pipeline();
        for (const follow of followers) {
          const key = `feed:${follow.followerId}`;
          pipeline.lpush(key, postId);
          pipeline.ltrim(key, 0, this.MAX_FEED_SIZE - 1);
        }
        await pipeline.exec();
        totalWritten += followers.length;
      }
      page++;
    } while (followers.length === BATCH_SIZE);

    return totalWritten;
  }

  /**
   * Update the author's recent posts list (for pull-on-read).
   */
  private async updateAuthorFeed(
    authorId: string,
    postId: string,
  ): Promise<void> {
    const key = `feed:author:${authorId}`;
    const pipeline = this.redis.pipeline();
    pipeline.lpush(key, postId);
    pipeline.ltrim(key, 0, this.MAX_AUTHOR_FEED - 1);
    pipeline.expire(key, this.AUTHOR_FEED_TTL);
    await pipeline.exec();
  }

  /**
   * Get a user's merged feed (push feed + pull from celebrities they follow).
   * Called at read time by the feed service.
   *
   * @returns Array of postIds, most recent first, deduplicated.
   */
  async getMergedFeedPostIds(
    userId: string,
    limit = 50,
    followedUserIds: string[],
  ): Promise<string[]> {
    // 1. Get push feed
    const pushFeedKey = `feed:${userId}`;
    const pushPostIds = await this.redis.lrange(pushFeedKey, 0, limit * 2 - 1);

    // 2. Check which followed users are celebrities
    if (followedUserIds.length === 0) {
      return pushPostIds.slice(0, limit);
    }

    let celebrityIds: string[] = [];
    try {
      // Check which of user's followed users are in the celebrity set
      const pipeline = this.redis.pipeline();
      for (const uid of followedUserIds) {
        pipeline.sismember('feed:celebrities', uid);
      }
      const results = await pipeline.exec();
      celebrityIds = followedUserIds.filter((_, i) => results?.[i]?.[1] === 1);
    } catch {
      // If celebrity check fails, just use push feed
    }

    if (celebrityIds.length === 0) {
      return pushPostIds.slice(0, limit);
    }

    // 3. Pull recent posts from celebrity feeds
    const pullPipeline = this.redis.pipeline();
    for (const celeb of celebrityIds) {
      pullPipeline.lrange(`feed:author:${celeb}`, 0, 20); // Last 20 from each celebrity
    }
    const pullResults = await pullPipeline.exec();
    const pullPostIds: string[] = [];
    for (const [err, ids] of pullResults || []) {
      if (!err && Array.isArray(ids)) {
        pullPostIds.push(...(ids as string[]));
      }
    }

    // 4. Merge and deduplicate (push posts come first as they're already ordered)
    const seen = new Set<string>();
    const merged: string[] = [];

    // Interleave: push and pull posts by recency (push items are already recent-first)
    // Simple merge: push first, then pull, deduplicate
    for (const id of pushPostIds) {
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(id);
      }
    }
    for (const id of pullPostIds) {
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(id);
      }
    }

    return merged.slice(0, limit);
  }

  /**
   * Remove a post from a user's feed (e.g., on delete/block).
   */
  async removeFromFeed(userId: string, postId: string): Promise<void> {
    await this.redis.lrem(`feed:${userId}`, 0, postId);
  }

  /**
   * Clear a user's entire feed cache (e.g., on account deletion).
   */
  async clearFeed(userId: string): Promise<void> {
    await this.redis.del(`feed:${userId}`);
  }
}
