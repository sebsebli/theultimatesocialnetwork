import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private readonly logger;
    private transporter;
    constructor(configService: ConfigService);
    private initializeTransporter;
    sendMagicLink(email: string, token: string, baseUrl?: string): Promise<boolean>;
    sendEmail(to: string, subject: string, html: string, text?: string, attachments?: Array<{
        filename: string;
        content: Buffer;
    }>): Promise<boolean>;
}
