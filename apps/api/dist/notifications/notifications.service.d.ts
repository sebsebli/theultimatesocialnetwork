import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
export declare class NotificationsService {
    private notificationRepo;
    private userRepo;
    private postRepo;
    constructor(notificationRepo: Repository<Notification>, userRepo: Repository<User>, postRepo: Repository<Post>);
    findAll(userId: string): Promise<{
        actor: User | null | undefined;
        post: Post | null | undefined;
        id: string;
        userId: string;
        type: string;
        actorUserId: string | null;
        postId: string | null;
        replyId: string | null;
        collectionId: string | null;
        createdAt: Date;
        readAt: Date | null;
    }[]>;
    markAsRead(userId: string, notificationId: string): Promise<Notification | null>;
    markAllAsRead(userId: string): Promise<void>;
}
