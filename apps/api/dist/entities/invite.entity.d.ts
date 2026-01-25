import { User } from './user.entity';
export declare class Invite {
    code: string;
    creatorId: string | null;
    creator: User;
    usedById: string | null;
    usedBy: User;
    createdAt: Date;
    usedAt: Date | null;
}
