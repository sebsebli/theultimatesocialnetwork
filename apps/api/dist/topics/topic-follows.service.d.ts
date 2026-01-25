import { Repository } from 'typeorm';
import { TopicFollow } from '../entities/topic-follow.entity';
import { Topic } from '../entities/topic.entity';
export declare class TopicFollowsService {
    private topicFollowRepo;
    private topicRepo;
    constructor(topicFollowRepo: Repository<TopicFollow>, topicRepo: Repository<Topic>);
    follow(userId: string, topicId: string): unknown;
    unfollow(userId: string, topicId: string): unknown;
    isFollowing(userId: string, topicId: string): Promise<boolean>;
}
