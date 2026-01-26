import { Repository } from 'typeorm';
import { DmThread } from '../entities/dm-thread.entity';
import { DmMessage } from '../entities/dm-message.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { NotificationHelperService } from '../shared/notification-helper.service';
export declare class MessagesService {
    private threadRepo;
    private messageRepo;
    private userRepo;
    private followRepo;
    private notificationHelper;
    constructor(threadRepo: Repository<DmThread>, messageRepo: Repository<DmMessage>, userRepo: Repository<User>, followRepo: Repository<Follow>, notificationHelper: NotificationHelperService);
    findOrCreateThread(userId: string, otherUserId: string): Promise<DmThread>;
    sendMessage(userId: string, threadId: string, body: string): Promise<DmMessage>;
    getThreads(userId: string): Promise<{
        id: any;
        otherUser: {
            id: any;
            handle: any;
            displayName: any;
        };
        lastMessage: {
            body: any;
            createdAt: any;
        } | null;
        unreadCount: number;
        createdAt: any;
    }[]>;
    getMessages(userId: string, threadId: string): Promise<DmMessage[]>;
}
