import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class MeilisearchService implements OnModuleInit {
    private configService;
    private client;
    private readonly indexName;
    constructor(configService: ConfigService);
    onModuleInit(): any;
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
    }): any;
    searchPosts(query: string, options?: {
        limit?: number;
        offset?: number;
        lang?: string;
    }): unknown;
    searchUsers(query: string, limit?: number): unknown;
    deletePost(postId: string): any;
}
