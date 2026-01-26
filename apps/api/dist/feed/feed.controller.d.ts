import { FeedService } from './feed.service';
export declare class FeedController {
    private readonly feedService;
    constructor(feedService: FeedService);
    getHomeFeed(user: {
        id: string;
    }, limit?: number, offset?: number, includeSavedBy?: string): Promise<import("./feed-item.entity").FeedItem[]>;
}
