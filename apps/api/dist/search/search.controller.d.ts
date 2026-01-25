import { MeilisearchService } from './meilisearch.service';
export declare class SearchController {
    private readonly meilisearch;
    constructor(meilisearch: MeilisearchService);
    searchPosts(user: {
        id: string;
    }, query: string, limit?: string, offset?: string, lang?: string): Promise<import("meilisearch").SearchResponse<Record<string, any>, {
        limit: number;
        offset: number;
        filter: string | undefined;
        sort: string[];
    }> | {
        hits: never[];
        estimatedTotalHits: number;
    }>;
    searchUsers(query: string, limit?: string): Promise<import("meilisearch").SearchResponse<Record<string, any>, {
        limit: number;
    }> | {
        hits: never[];
    }>;
}
