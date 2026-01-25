import { Repository } from 'typeorm';
import { PushToken } from '../entities/push-token.entity';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
export declare class PushService {
    private pushTokenRepo;
    constructor(pushTokenRepo: Repository<PushToken>);
    register(userId: string, dto: RegisterPushTokenDto): unknown;
}
