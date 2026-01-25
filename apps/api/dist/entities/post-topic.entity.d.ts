import { Post } from './post.entity';
import { Topic } from './topic.entity';
export declare class PostTopic {
    postId: string;
    topicId: string;
    post: Post;
    topic: Topic;
}
