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
    }): Promise<import("meilisearch").SearchResponse<Record<string, any>, {
        limit: number;
        offset: number;
        filter: string | undefined;
        sort: string[];
    }> | {
        hits: never[];
        estimatedTotalHits: number;
    }>;
    searchUsers(query: string, limit?: number): Promise<import("meilisearch").SearchResponse<Record<string, any>, {
        limit: number;
    }> | {
        hits: never[];
    }>;
    searchTopics(query: string, limit?: number): Promise<import("meilisearch").SearchResponse<Record<string, any>, {
        limit: number;
    }> | {
        hits: never[];
    }>;
    deletePost(postId: string): Promise<void>;
}
