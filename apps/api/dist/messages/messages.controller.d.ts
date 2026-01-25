import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    getThreads(user: {
        id: string;
    }): Promise<{
        id: string;
        otherUser: import("../entities/user.entity").User | null;
        lastMessage: import("../entities/dm-message.entity").DmMessage | null;
        unreadCount: number;
        createdAt: Date;
    }[]>;
    createThread(user: {
        id: string;
    }, dto: {
        userId: string;
    }): Promise<import("../entities/dm-thread.entity").DmThread>;
    getMessages(user: {
        id: string;
    }, threadId: string): Promise<import("../entities/dm-message.entity").DmMessage[]>;
    sendMessage(user: {
        id: string;
    }, threadId: string, dto: {
        body: string;
    }): Promise<import("../entities/dm-message.entity").DmMessage>;
}
