import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushToken, PushProvider } from '../entities/push-token.entity';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { encryptField, hashForLookup } from '../shared/field-encryption';

@Injectable()
export class PushService {
  constructor(
    @InjectRepository(PushToken) private pushTokenRepo: Repository<PushToken>,
  ) {}

  async register(userId: string, dto: RegisterPushTokenDto) {
    const tokenHash = hashForLookup(dto.token);

    // Upsert logic — use hash for dedup
    let token = await this.pushTokenRepo.findOne({
      where: { tokenHash, provider: dto.provider as PushProvider },
    });
    // Fallback: plaintext lookup for pre-migration rows
    if (!token) {
      token = await this.pushTokenRepo.findOne({
        where: { provider: dto.provider as PushProvider, token: dto.token },
      });
    }

    if (token) {
      token.userId = userId;
      token.lastSeenAt = new Date();
      token.disabledAt = null; // Re-enable
      // Migrate to encrypted if not yet
      if (!token.tokenHash) {
        token.token = encryptField(dto.token);
        token.tokenHash = tokenHash;
      }
    } else {
      token = this.pushTokenRepo.create({
        userId,
        provider: dto.provider as PushProvider,
        token: encryptField(dto.token),
        tokenHash,
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
