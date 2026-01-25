import { FeedService } from './feed.service';
export declare class FeedController {
    private readonly feedService;
    constructor(feedService: FeedService);
    getHomeFeed(user: {
        id: string;
    }, limit?: string, offset?: string, includeSavedBy?: string): unknown;
}
