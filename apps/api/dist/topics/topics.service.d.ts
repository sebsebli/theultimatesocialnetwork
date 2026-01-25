import { Repository } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { Post } from '../entities/post.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { ExploreService } from '../explore/explore.service';
export declare class TopicsService {
    private topicRepo;
    private postRepo;
    private postTopicRepo;
    private exploreService;
    constructor(topicRepo: Repository<Topic>, postRepo: Repository<Post>, postTopicRepo: Repository<PostTopic>, exploreService: ExploreService);
    findOne(slug: string): unknown;
    getPosts(topicId: string): unknown;
}
