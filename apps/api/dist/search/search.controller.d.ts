import { MeilisearchService } from './meilisearch.service';
export declare class SearchController {
    private readonly meilisearch;
    constructor(meilisearch: MeilisearchService);
    searchPosts(user: {
        id: string;
    }, query: string, limit: number, offset: number, lang?: string): Promise<import("meilisearch").SearchResponse<Record<string, any>, {
        limit: number;
        offset: number;
        filter: string | undefined;
        sort: string[];
    }> | {
        hits: never[];
        estimatedTotalHits: number;
    }>;
    searchUsers(query: string, limit: number): Promise<import("meilisearch").SearchResponse<Record<string, any>, {
        limit: number;
    }> | {
        hits: never[];
    }>;
    searchTopics(query: string, limit: number): Promise<import("meilisearch").SearchResponse<Record<string, any>, {
        limit: number;
    }> | {
        hits: never[];
    }>;
}
