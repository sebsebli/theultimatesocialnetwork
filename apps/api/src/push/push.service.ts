import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushToken } from '../entities/push-token.entity';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@Injectable()
export class PushService {
  constructor(
    @InjectRepository(PushToken) private pushTokenRepo: Repository<PushToken>,
  ) {}

  async register(userId: string, dto: RegisterPushTokenDto) {
    // Upsert logic
    let token = await this.pushTokenRepo.findOne({
      where: { provider: dto.provider as any, token: dto.token } as any,
    });

    if (token) {
      token.userId = userId;
      token.lastSeenAt = new Date();
      token.disabledAt = null; // Re-enable
      // Update other fields if changed
    } else {
      token = this.pushTokenRepo.create({
        userId,
        provider: dto.provider as any,
        token: dto.token,
        platform: dto.platform,
        deviceId: dto.device_id,
        appVersion: dto.app_version,
        locale: dto.locale,
        apnsEnvironment: dto.apns_environment,
      });
    }
    return this.pushTokenRepo.save(token);
  }
}
