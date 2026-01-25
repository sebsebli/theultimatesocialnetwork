export declare class RegisterPushTokenDto {
    provider: "APNS" | "FCM";
    token: string;
    platform: "ios" | "android";
    device_id?: string;
    app_version?: string;
    locale?: string;
    apns_environment?: "sandbox" | "production";
}
