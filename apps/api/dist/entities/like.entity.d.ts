import { User } from './user.entity';
import { Post } from './post.entity';
export declare class Like {
    userId: string;
    postId: string;
    createdAt: Date;
    user: User;
    post: Post;
}
