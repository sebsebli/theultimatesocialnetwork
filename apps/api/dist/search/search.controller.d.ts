import { MeilisearchService } from './meilisearch.service';
export declare class SearchController {
    private readonly meilisearch;
    constructor(meilisearch: MeilisearchService);
    searchPosts(user: {
        id: string;
    }, query: string, limit?: string, offset?: string, lang?: string): unknown;
    searchUsers(query: string, limit?: string): unknown;
}
