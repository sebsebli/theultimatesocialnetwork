import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
export declare class NotificationsService {
    private notificationRepo;
    private userRepo;
    private postRepo;
    constructor(notificationRepo: Repository<Notification>, userRepo: Repository<User>, postRepo: Repository<Post>);
    findAll(userId: string): Promise<any[]>;
    markAsRead(userId: string, notificationId: string): Promise<Notification | null>;
    markAllAsRead(userId: string): Promise<void>;
}
