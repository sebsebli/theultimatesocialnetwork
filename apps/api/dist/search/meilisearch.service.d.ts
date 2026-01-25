import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class MeilisearchService implements OnModuleInit {
    private configService;
    private client;
    private readonly indexName;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    indexPost(post: {
        id: string;
        title?: string | null;
        body: string;
        authorId: string;
        author?: {
            displayName?: string;
            handle: string;
        } | null;
        lang?: string | null;
        createdAt: Date;
        quoteCount: number;
        replyCount: number;
    }): Promise<void>;
    searchPosts(query: string, options?: {
        limit?: number;
        offset?: number;
        lang?: string;
    }): Promise<any>;
    searchUsers(query: string, limit?: number): Promise<any>;
    deletePost(postId: string): Promise<void>;
}
