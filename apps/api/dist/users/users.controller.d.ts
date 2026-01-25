import { UsersService } from './users.service';
import { Queue } from 'bullmq';
export declare class UsersController {
    private readonly usersService;
    private exportQueue;
    constructor(usersService: UsersService, exportQueue: Queue);
    updateMe(user: {
        id: string;
    }, updates: any): Promise<import("../entities/user.entity").User>;
    getMe(user: {
        id: string;
    }): Promise<{
        posts: import("../entities/post.entity").Post[];
        id: string;
        email: string;
        handle: string;
        displayName: string;
        bio: string;
        isProtected: boolean;
        invitesRemaining: number;
        languages: string[];
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date;
        followerCount: number;
        followingCount: number;
        quoteReceivedCount: number;
    } | null>;
    deleteMe(user: {
        id: string;
    }): Promise<{
        success: boolean;
    }>;
    exportData(user: {
        id: string;
        email?: string;
    }): Promise<{
        message: string;
    }>;
    getSuggested(): Promise<import("../entities/user.entity").User[]>;
    getReplies(id: string): Promise<import("../entities/reply.entity").Reply[]>;
    getQuotes(id: string): Promise<import("../entities/post.entity").Post[]>;
    findOne(handle: string): Promise<{
        posts: import("../entities/post.entity").Post[];
        id: string;
        email: string;
        handle: string;
        displayName: string;
        bio: string;
        isProtected: boolean;
        invitesRemaining: number;
        languages: string[];
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date;
        followerCount: number;
        followingCount: number;
        quoteReceivedCount: number;
    } | null>;
}
