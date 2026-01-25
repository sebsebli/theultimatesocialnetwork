import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    getThreads(user: {
        id: string;
    }): unknown;
    createThread(user: {
        id: string;
    }, dto: {
        userId: string;
    }): unknown;
    getMessages(user: {
        id: string;
    }, threadId: string): unknown;
    sendMessage(user: {
        id: string;
    }, threadId: string, dto: {
        body: string;
    }): unknown;
}
