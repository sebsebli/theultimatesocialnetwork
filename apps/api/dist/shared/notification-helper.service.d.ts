import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
export declare class NotificationHelperService {
    private notificationRepo;
    private realtimeGateway;
    constructor(notificationRepo: Repository<Notification>, realtimeGateway: RealtimeGateway);
    createNotification(data: {
        userId: string;
        type: NotificationType;
        actorUserId?: string;
        postId?: string;
        replyId?: string;
        collectionId?: string;
    }): Promise<Notification | undefined>;
}
