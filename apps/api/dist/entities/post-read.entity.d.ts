import { User } from './user.entity';
import { Post } from './post.entity';
export declare class PostRead {
    id: string;
    userId: string;
    postId: string;
    user: User;
    post: Post;
    durationSeconds: number;
    createdAt: Date;
    lastReadAt: Date;
}
