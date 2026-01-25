export declare enum PushStatus {
    PENDING = "pending",
    SENT = "sent",
    FAILED = "failed",
    SUPPRESSED = "suppressed"
}
export declare class PushOutbox {
    id: string;
    userId: string;
    notifType: string;
    title: string;
    body: string;
    data: any;
    priority: string;
    status: PushStatus;
    attemptCount: number;
    lastError: string;
    createdAt: Date;
    sentAt: Date;
}
