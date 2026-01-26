import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    getThreads(user: {
        id: string;
    }): Promise<{
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
