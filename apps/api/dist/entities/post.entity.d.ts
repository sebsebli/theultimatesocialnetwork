import { User } from './user.entity';
export declare enum PostVisibility {
    FOLLOWERS = "FOLLOWERS",
    PUBLIC = "PUBLIC"
}
export declare class Post {
    id: string;
    authorId: string;
    author: User;
    visibility: PostVisibility;
    body: string;
    title: string | null;
    headerImageKey: string | null;
    headerImageBlurhash: string | null;
    lang: string | null;
    langConfidence: number | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    replyCount: number;
    quoteCount: number;
    privateLikeCount: number;
    viewCount: number;
    readingTimeMinutes: number;
}
