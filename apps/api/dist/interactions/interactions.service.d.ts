import { Repository } from 'typeorm';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';
import { Post } from '../entities/post.entity';
import { PostRead } from '../entities/post-read.entity';
import { NotificationHelperService } from '../shared/notification-helper.service';
import Redis from 'ioredis';
export declare class InteractionsService {
    private likeRepo;
    private keepRepo;
    private postRepo;
    private readRepo;
    private notificationHelper;
    private redis;
    constructor(likeRepo: Repository<Like>, keepRepo: Repository<Keep>, postRepo: Repository<Post>, readRepo: Repository<PostRead>, notificationHelper: NotificationHelperService, redis: Redis);
    recordReadDuration(userId: string, postId: string, durationSeconds: number): Promise<void>;
    recordView(postId: string): Promise<void>;
    flushViews(): Promise<void>;
    toggleLike(userId: string, postId: string): Promise<{
        liked: boolean;
    }>;
    toggleKeep(userId: string, postId: string): Promise<{
        kept: boolean;
    }>;
}
