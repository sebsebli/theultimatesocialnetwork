import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: {
        id: string;
    }): Promise<{
        actor: import("../entities/user.entity").User | null | undefined;
        post: import("../entities/post.entity").Post | null | undefined;
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
    markAsRead(user: {
        id: string;
    }, notificationId: string): Promise<import("../entities/notification.entity").Notification | null>;
    markAllAsRead(user: {
        id: string;
    }): Promise<void>;
}
