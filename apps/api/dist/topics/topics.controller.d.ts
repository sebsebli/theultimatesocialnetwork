import { TopicsService } from './topics.service';
import { TopicFollowsService } from './topic-follows.service';
export declare class TopicsController {
    private readonly topicsService;
    private readonly topicFollowsService;
    constructor(topicsService: TopicsService, topicFollowsService: TopicFollowsService);
    findOne(slug: string, user?: {
        id: string;
    }): unknown;
    follow(user: {
        id: string;
    }, slug: string): unknown;
    unfollow(user: {
        id: string;
    }, slug: string): unknown;
}
