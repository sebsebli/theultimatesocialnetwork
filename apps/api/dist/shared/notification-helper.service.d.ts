import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
export declare class NotificationHelperService {
    private notificationRepo;
    constructor(notificationRepo: Repository<Notification>);
    createNotification(data: {
        userId: string;
        type: NotificationType;
        actorUserId?: string;
        postId?: string;
        replyId?: string;
        collectionId?: string;
    }): unknown;
}
