import { DmThread } from './dm-thread.entity';
export declare class DmMessage {
    id: string;
    threadId: string;
    thread: DmThread;
    senderId: string;
    body: string;
    createdAt: Date;
    deletedAt: Date;
}
