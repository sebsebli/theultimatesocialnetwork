export declare enum PushProvider {
    APNS = "APNS",
    FCM = "FCM"
}
export declare class PushToken {
    id: string;
    userId: string;
    provider: PushProvider;
    token: string;
    platform: string;
    deviceId: string;
    appVersion: string;
    locale: string;
    apnsEnvironment: string;
    createdAt: Date;
    lastSeenAt: Date;
    disabledAt: Date | null;
}
