import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';
import { Post } from '../entities/post.entity';
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
    private notificationHelper: NotificationHelperService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async recordReadDuration(userId: string, postId: string, durationSeconds: number) {
    if (!userId || durationSeconds <= 0) return;

    // Buffer writes? For user history, immediate upsert is usually okay if traffic isn't Facebook-scale.
    // But for safety, we can use a simpler approach: direct UPSERT.
    // "ON CONFLICT (user_id, post_id) DO UPDATE SET duration_seconds = duration_seconds + excluded.duration_seconds"
    
    // Using TypeORM upsert
    const existing = await this.readRepo.findOne({ where: { userId, postId } });
    if (existing) {
      existing.durationSeconds += durationSeconds;
      existing.lastReadAt = new Date();
      await this.readRepo.save(existing);
    } else {
      await this.readRepo.save({
        userId,
        postId,
        durationSeconds,
      });
    }
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
        await this.postRepo.increment({ id: postId }, 'viewCount', parseInt(views));
        // Decrease Redis count or delete
        await this.redis.del(key);
      }
    }
    // Clear the set
    await this.redis.del('post:views:active_set');
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
      if (post.authorId !== userId) {
        await this.notificationHelper.createNotification({
          userId: post.authorId,
          type: 'LIKE' as any,
          actorUserId: userId,
          postId: postId,
        });
      }
      
      return { liked: true };
    }
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
}