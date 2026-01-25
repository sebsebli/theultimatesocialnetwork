import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: {
        id: string;
    }): Promise<any[]>;
    markAsRead(user: {
        id: string;
    }, notificationId: string): Promise<import("../entities/notification.entity").Notification | null>;
    markAllAsRead(user: {
        id: string;
    }): Promise<void>;
}
