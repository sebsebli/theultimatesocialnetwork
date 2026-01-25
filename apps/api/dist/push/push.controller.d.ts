import { PushService } from './push.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
export declare class PushController {
    private readonly pushService;
    constructor(pushService: PushService);
    register(user: {
        id: string;
    }, dto: RegisterPushTokenDto): unknown;
}
