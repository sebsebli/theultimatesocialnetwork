export declare enum ReportTargetType {
    POST = "POST",
    REPLY = "REPLY",
    USER = "USER",
    DM = "DM"
}
export declare enum ReportStatus {
    OPEN = "OPEN",
    REVIEWED = "REVIEWED",
    ACTIONED = "ACTIONED",
    DISMISSED = "DISMISSED"
}
export declare class Report {
    id: string;
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    createdAt: Date;
    status: ReportStatus;
}
