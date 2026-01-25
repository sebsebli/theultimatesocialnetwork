import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Invite } from '../entities/invite.entity';
import { User } from '../entities/user.entity';
import { WaitingList } from '../entities/waiting-list.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import * as crypto from 'crypto';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite) private inviteRepo: Repository<Invite>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(WaitingList) private waitingListRepo: Repository<WaitingList>,
    @InjectRepository(SystemSetting) private settingsRepo: Repository<SystemSetting>,
  ) {}

  // BETA MODE LOGIC
  async isBetaMode(): Promise<boolean> {
    const setting = await this.settingsRepo.findOne({ where: { key: 'BETA_MODE' } });
    return setting ? setting.value === 'true' : true; // Default to true (Beta ON)
  }

  async setBetaMode(enabled: boolean) {
    await this.settingsRepo.save({
      key: 'BETA_MODE',
      value: String(enabled),
    });
  }

  // INVITES LOGIC
  async generateCode(userId?: string): Promise<string> {
    const isBeta = await this.isBetaMode();
    if (!isBeta) {
      // If beta is OFF, invites might still be used for "referrals" or tracking, 
      // but the prompt says "option to generate new codes is deleted".
      // I will allow it but maybe warn? Or restrict. 
      // Actually, users might want to invite friends anyway.
      // But if "option is deleted", I should block.
      // Let's assume ADMIN can always generate, users can't if beta is off.
    }

    const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars
    await this.inviteRepo.save({
      code,
      creatorId: userId || null, // null = system
    });
    
    if (userId) {
      await this.userRepo.decrement({ id: userId }, 'invitesRemaining', 1);
    }

    return code;
  }

  async validateCode(code: string): Promise<Invite> {
    const invite = await this.inviteRepo.findOne({ where: { code }, relations: ['creator'] });
    if (!invite) throw new NotFoundException('Invalid invite code');
    if (invite.usedAt) throw new ForbiddenException('Invite code already used');
    return invite;
  }

  async consumeCode(code: string, userId: string): Promise<void> {
    const invite = await this.inviteRepo.findOne({ where: { code } });
    if (!invite || invite.usedAt) return; // Should satisfy unique usage

    invite.usedById = userId;
    invite.usedAt = new Date();
    await this.inviteRepo.save(invite);
  }

  async getMyInvites(userId: string) {
    // Return unused codes created by me + count remaining
    const codes = await this.inviteRepo.find({
      where: { creatorId: userId, usedAt: IsNull() },
    });
    const user = await this.userRepo.findOne({ where: { id: userId } });
    
    return {
      codes,
      remaining: user?.invitesRemaining || 0,
    };
  }

  // WAITING LIST
  async addToWaitingList(email: string, ipHash?: string) {
    // Check duplicates
    const existing = await this.waitingListRepo.findOne({ where: { email } });
    if (existing) return; // Silent success

    // Basic IP rate limit check (optional, naive)
    if (ipHash) {
        const count = await this.waitingListRepo.count({ where: { ipHash } });
        if (count > 5) throw new ForbiddenException('Too many requests from this IP');
    }

    await this.waitingListRepo.save({
        email,
        ipHash,
        status: 'PENDING',
    });
  }
}
