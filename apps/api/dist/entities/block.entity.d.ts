import { User } from './user.entity';
export declare class Block {
    blockerId: string;
    blockedId: string;
    blocker: User;
    blocked: User;
    createdAt: Date;
}
