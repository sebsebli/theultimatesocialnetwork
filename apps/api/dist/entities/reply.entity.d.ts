export declare class Reply {
    id: string;
    postId: string;
    authorId: string;
    parentReplyId: string | null;
    body: string;
    lang: string;
    langConfidence: number;
    createdAt: Date;
    deletedAt: Date;
}
