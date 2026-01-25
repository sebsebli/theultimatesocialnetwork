export declare enum FollowRequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class FollowRequest {
    id: string;
    requesterId: string;
    targetId: string;
    status: FollowRequestStatus;
    createdAt: Date;
}
