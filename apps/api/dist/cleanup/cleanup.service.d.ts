import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Notification } from '../entities/notification.entity';
import { PushOutbox } from '../entities/push-outbox.entity';
export declare class CleanupService {
    private postRepo;
    private userRepo;
    private notificationRepo;
    private pushOutboxRepo;
    private readonly logger;
    constructor(postRepo: Repository<Post>, userRepo: Repository<User>, notificationRepo: Repository<Notification>, pushOutboxRepo: Repository<PushOutbox>);
    handleCron(): Promise<void>;
    private deleteOldNotifications;
    private deleteOldPushOutbox;
    private deleteOldSoftDeletedPosts;
    private deleteOldSoftDeletedUsers;
}
