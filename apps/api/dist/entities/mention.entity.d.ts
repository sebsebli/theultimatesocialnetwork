import { Post } from './post.entity';
import { Reply } from './reply.entity';
import { User } from './user.entity';
export declare class Mention {
    id: string;
    postId: string;
    post: Post;
    replyId: string;
    reply: Reply;
    mentionedUserId: string;
    mentionedUser: User;
    createdAt: Date;
}
