import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { Invite } from '../entities/invite.entity';
import { User } from '../entities/user.entity';
import { WaitingList } from '../entities/waiting-list.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { EmailService } from '../shared/email.service';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite) private inviteRepo: Repository<Invite>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(WaitingList)
    private waitingListRepo: Repository<WaitingList>,
    @InjectRepository(SystemSetting)
    private settingsRepo: Repository<SystemSetting>,
    private emailService: EmailService,
  ) {}

  // BETA MODE LOGIC
  async isBetaMode(): Promise<boolean> {
    const setting = await this.settingsRepo.findOne({
      where: { key: 'BETA_MODE' },
    });
    return setting ? setting.value === 'true' : true; // Default to true (Beta ON)
  }

  async setBetaMode(enabled: boolean) {
    await this.settingsRepo.save({
      key: 'BETA_MODE',
      value: String(enabled),
    });
  }

  // INVITES LOGIC
  // Codes are unique (PK), single-use (usedAt), and claimed in auth flow via consumeCode.
  async generateCode(userId?: string): Promise<string> {
    if (userId) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user || user.invitesRemaining <= 0) {
        throw new BadRequestException('No invites remaining');
      }
    }

    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars, unique with high probability
      const exists = await this.inviteRepo.findOne({ where: { code } });
      if (exists) continue;

      await this.inviteRepo.save({
        code,
        creatorId: userId ?? null,
      });
      if (userId) {
        await this.userRepo.decrement({ id: userId }, 'invitesRemaining', 1);
      }
      return code;
    }
    throw new BadRequestException('Failed to generate unique invite code');
  }

  async validateCode(code: string): Promise<Invite> {
    const invite = await this.inviteRepo.findOne({
      where: { code },
      relations: ['creator'],
    });
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
    const codes = await this.inviteRepo.find({
      where: { creatorId: userId, usedAt: IsNull() },
    });
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return {
      codes,
      remaining: user?.invitesRemaining ?? 0,
    };
  }

  /** Create a system invite code and send it to the given email (localized). Returns the code; email may still fail if SMTP is not configured. */
  async createCodeAndSendToEmail(
    email: string,
    lang: string = 'en',
  ): Promise<{ code: string; sent: boolean }> {
    const trimmed = email?.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new BadRequestException('Valid email is required');
    }

    const code = await this.generateCode(undefined);
    const sent = await this.emailService.sendInviteCode(trimmed, code, lang);
    return { code, sent };
  }

  // WAITING LIST
  async addToWaitingList(email: string, ipHash?: string) {
    // Check duplicates
    const existing = await this.waitingListRepo.findOne({ where: { email } });
    if (existing) return; // Silent success

    // Basic IP rate limit check (optional, naive)
    if (ipHash) {
      const count = await this.waitingListRepo.count({ where: { ipHash } });
      if (count > 5)
        throw new ForbiddenException('Too many requests from this IP');
    }

    await this.waitingListRepo.save({
      email,
      ipHash,
      status: 'PENDING',
    });
  }
}
