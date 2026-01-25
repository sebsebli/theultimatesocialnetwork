import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: {
        id: string;
    }): unknown;
    markAsRead(user: {
        id: string;
    }, notificationId: string): unknown;
    markAllAsRead(user: {
        id: string;
    }): any;
}
