import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';
import { Post } from '../entities/post.entity';
import { NotificationType } from '../entities/notification.entity';
import { PostRead } from '../entities/post-read.entity';
import { NotificationHelperService } from '../shared/notification-helper.service';
import Redis from 'ioredis';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(Like) private likeRepo: Repository<Like>,
    @InjectRepository(Keep) private keepRepo: Repository<Keep>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(PostRead) private readRepo: Repository<PostRead>,
    private dataSource: DataSource,
    private notificationHelper: NotificationHelperService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async recordReadDuration(
    userId: string,
    postId: string,
    durationSeconds: number,
  ) {
    if (!userId || durationSeconds <= 0) return;

    // Use query builder for atomic upsert
    await this.readRepo
      .createQueryBuilder()
      .insert()
      .into(PostRead)
      .values({
        userId,
        postId,
        durationSeconds,
        lastReadAt: new Date(),
      })
      .orUpdate(['duration_seconds', 'last_read_at'], ['user_id', 'post_id'])
      .setParameters({ durationSeconds })
      // This part is tricky with QueryBuilder inserts,
      // let's use a simpler standard approach if orUpdate syntax varies by DB
      .execute();

    // Actually, for duration accumulation:
    await this.dataSource.query(
      `INSERT INTO post_reads (user_id, post_id, duration_seconds, last_read_at) 
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, post_id) 
       DO UPDATE SET 
         duration_seconds = post_reads.duration_seconds + EXCLUDED.duration_seconds,
         last_read_at = EXCLUDED.last_read_at`,
      [userId, postId, durationSeconds],
    );
  }

  async recordView(postId: string) {
    // Buffer views in Redis to avoid DB write thrashing
    const key = `post:views:${postId}`;
    await this.redis.incr(key);
    // Add to a set of active posts to scan
    await this.redis.sadd('post:views:active_set', postId);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async flushViews() {
    const activePosts = await this.redis.smembers('post:views:active_set');
    if (activePosts.length === 0) return;

    for (const postId of activePosts) {
      const key = `post:views:${postId}`;
      const views = await this.redis.get(key);
      if (views && parseInt(views) > 0) {
        // Atomic increment in DB
        await this.postRepo.increment(
          { id: postId },
          'viewCount',
          parseInt(views),
        );
        // Decrease Redis count or delete
        await this.redis.del(key);
      }
    }
    // Clear the set
    await this.redis.del('post:views:active_set');
  }

  /** Batch-load which of the given postIds the viewer has liked and kept. Returns sets of post IDs. */
  async getLikeKeepForViewer(
    userId: string,
    postIds: string[],
  ): Promise<{ likedIds: Set<string>; keptIds: Set<string> }> {
    const unique = Array.from(new Set(postIds.filter(Boolean)));
    if (unique.length === 0) {
      return { likedIds: new Set(), keptIds: new Set() };
    }
    const [likes, keeps] = await Promise.all([
      this.likeRepo.find({
        where: { userId, postId: In(unique) },
        select: ['postId'],
      }),
      this.keepRepo.find({
        where: { userId, postId: In(unique) },
        select: ['postId'],
      }),
    ]);
    return {
      likedIds: new Set(likes.map((l) => l.postId)),
      keptIds: new Set(keeps.map((k) => k.postId)),
    };
  }

  async toggleLike(userId: string, postId: string) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      withDeleted: false, // Exclude soft-deleted posts
    });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.likeRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.likeRepo.remove(existing);
      await this.postRepo.decrement({ id: postId }, 'privateLikeCount', 1);
      return { liked: false };
    } else {
      await this.likeRepo.save({ userId, postId });
      await this.postRepo.increment({ id: postId }, 'privateLikeCount', 1);

      // Notify post author (private notification)
      if (post.authorId && post.authorId !== userId) {
        await this.notificationHelper.createNotification({
          userId: post.authorId,
          type: NotificationType.LIKE,
          actorUserId: userId,
          postId: postId,
        });
      }

      return { liked: true };
    }
  }

  async removeLike(userId: string, postId: string) {
    const existing = await this.likeRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.likeRepo.remove(existing);
      await this.postRepo.decrement({ id: postId }, 'privateLikeCount', 1);
    }
    return { liked: false };
  }

  async toggleKeep(userId: string, postId: string) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      withDeleted: false, // Exclude soft-deleted posts
    });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.keepRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.keepRepo.remove(existing);
      return { kept: false };
    } else {
      await this.keepRepo.save({ userId, postId });
      return { kept: true };
    }
  }

  async removeKeep(userId: string, postId: string) {
    const existing = await this.keepRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.keepRepo.remove(existing);
    }
    return { kept: false };
  }
}
