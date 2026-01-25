import { AuthService } from '../auth.service';
import { EmailService } from '../../shared/email.service';
import { ConfigService } from '@nestjs/config';
declare const MagicLoginStrategyImpl_base: new (...args: any[]) => InstanceType<any>;
export declare class MagicLoginStrategyImpl extends MagicLoginStrategyImpl_base {
    private authService;
    private emailService;
    private configService;
    private readonly logger;
    constructor(authService: AuthService, emailService: EmailService, configService: ConfigService);
}
export {};
