import { ConfigService } from '@nestjs/config';
export declare class ApnsSender {
    private configService;
    private readonly logger;
    private session;
    private token;
    private tokenGeneratedAt;
    constructor(configService: ConfigService);
    private getAuthToken;
    private getSession;
    send(args: {
        deviceToken: string;
        title: string;
        body: string;
        data: Record<string, string>;
        environment: 'sandbox' | 'production';
    }): Promise<{
        ok: boolean;
        invalidToken?: boolean;
        error?: string;
    }>;
}
