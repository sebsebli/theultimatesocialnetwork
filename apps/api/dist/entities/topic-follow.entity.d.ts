import { User } from './user.entity';
import { Topic } from './topic.entity';
export declare class TopicFollow {
    userId: string;
    topicId: string;
    user: User;
    topic: Topic;
    createdAt: Date;
}
