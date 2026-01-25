import { Post } from './post.entity';
export declare enum EdgeType {
    LINK = "LINK",
    QUOTE = "QUOTE"
}
export declare class PostEdge {
    id: string;
    fromPostId: string;
    toPostId: string;
    fromPost: Post;
    toPost: Post;
    edgeType: EdgeType;
    anchorText: string | null;
    createdAt: Date;
}
