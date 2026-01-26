import { TopicsService } from './topics.service';
import { TopicFollowsService } from './topic-follows.service';
export declare class TopicsController {
    private readonly topicsService;
    private readonly topicFollowsService;
    constructor(topicsService: TopicsService, topicFollowsService: TopicFollowsService);
    findOne(slug: string, user?: {
        id: string;
    }): Promise<{
        posts: import("../entities/post.entity").Post[];
        isFollowing: boolean;
        startHere: import("../entities/post.entity").Post[];
        id: string;
        slug: string;
        title: string;
        createdAt: Date;
        createdBy: string;
    }>;
    follow(user: {
        id: string;
    }, slug: string): Promise<import("../entities/topic-follow.entity").TopicFollow>;
    unfollow(user: {
        id: string;
    }, slug: string): Promise<{
        success: boolean;
    }>;
}
