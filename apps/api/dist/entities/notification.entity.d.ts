export declare enum NotificationType {
    FOLLOW = "FOLLOW",
    FOLLOW_REQUEST = "FOLLOW_REQUEST",
    REPLY = "REPLY",
    QUOTE = "QUOTE",
    LIKE = "LIKE",
    MENTION = "MENTION",
    COLLECTION_ADD = "COLLECTION_ADD",
    DM = "DM"
}
export declare class Notification {
    id: string;
    userId: string;
    type: string;
    actorUserId: string | null;
    postId: string | null;
    replyId: string | null;
    collectionId: string | null;
    createdAt: Date;
    readAt: Date | null;
}
