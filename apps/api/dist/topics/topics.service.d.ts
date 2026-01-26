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
    findOne(slug: string): Promise<{
        posts: Post[];
        startHere: Post[];
        id: string;
        slug: string;
        title: string;
        createdAt: Date;
        createdBy: string;
    } | null>;
    getPosts(topicId: string, limit?: number, offset?: number): Promise<Post[]>;
}
