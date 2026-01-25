import { Post } from './post.entity';
export declare class ExternalSource {
    id: string;
    postId: string;
    post: Post;
    url: string;
    canonicalUrl: string | null;
    title: string | null;
    createdAt: Date;
}
