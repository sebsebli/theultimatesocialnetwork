import { ConfigService } from '@nestjs/config';
export declare class FcmSender {
    private configService;
    private readonly logger;
    private initialized;
    constructor(configService: ConfigService);
    private initialize;
    send(args: {
        token: string;
        title: string;
        body: string;
        data: Record<string, string>;
    }): Promise<{
        ok: boolean;
        invalidToken?: boolean;
        error?: string;
    }>;
}
