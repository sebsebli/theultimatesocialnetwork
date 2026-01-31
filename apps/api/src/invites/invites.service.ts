import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Invite, InviteStatus } from '../entities/invite.entity';
import { User } from '../entities/user.entity';
import { WaitingList } from '../entities/waiting-list.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../shared/email.service';

const INVITE_EXPIRY_DAYS = 7;
const INVITE_LIMIT_PER_USER = 3;
const RESEND_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    @InjectRepository(Invite) private inviteRepo: Repository<Invite>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(WaitingList)
    private waitingListRepo: Repository<WaitingList>,
    @InjectRepository(SystemSetting)
    private settingsRepo: Repository<SystemSetting>,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async isBetaMode(): Promise<boolean> {
    const setting = await this.settingsRepo.findOne({
      where: { key: 'BETA_MODE' },
    });
    return setting ? setting.value === 'true' : true;
  }

  async setBetaMode(enabled: boolean) {
    await this.settingsRepo.save({
      key: 'BETA_MODE',
      value: String(enabled),
    });
  }

  /** Referral link for sharing (post-beta). Deep link works on web and app. */
  async getReferralLink(
    userId: string,
  ): Promise<{ referralLink: string; referralId: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const baseUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'https://cite.app'
    ).replace(/\/$/, '');
    const referralId = user.handle;
    const referralLink = `${baseUrl}/invite/@${referralId}`;
    return { referralLink, referralId };
  }

  /** Resolve effective status (DB may not have status set for legacy rows). */
  private resolveStatus(invite: Invite): InviteStatus {
    if (invite.revokedAt) return 'REVOKED';
    if (invite.usedAt) return 'ACTIVATED';
    if (invite.expiresAt && invite.expiresAt < new Date()) return 'EXPIRED';
    return invite.status ?? 'PENDING';
  }

  /** Send invite by email (beta only). Email required; code generated and sent. Limit 3 pending per user. */
  async sendByEmail(
    userId: string,
    email: string,
    lang: string = 'en',
  ): Promise<{ invite: Invite; sent: boolean }> {
    const isBeta = await this.isBetaMode();
    if (!isBeta) {
      throw new BadRequestException(
        'Invitations are only available during beta.',
      );
    }

    const trimmed = email?.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new BadRequestException('A valid email address is required.');
    }

    const creator = await this.userRepo.findOne({ where: { id: userId } });
    if (!creator) throw new NotFoundException('User not found');

    const invites = await this.inviteRepo.find({
      where: { creatorId: userId },
    });
    const pending = invites.filter((i) => this.resolveStatus(i) === 'PENDING');
    if (pending.length >= INVITE_LIMIT_PER_USER) {
      throw new BadRequestException(
        `You can have at most ${INVITE_LIMIT_PER_USER} pending invitations. Revoke or wait for one to expire.`,
      );
    }

    const maxAttempts = 10;
    for (let a = 0; a < maxAttempts; a++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const exists = await this.inviteRepo.findOne({ where: { code } });
      if (exists) continue;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

      const invite = await this.inviteRepo.save({
        code,
        creatorId: userId,
        email: trimmed,
        expiresAt,
        status: 'PENDING',
        lastSentAt: new Date(),
      });

      const inviterName = creator.displayName || creator.handle || 'A friend';
      const sent = await this.emailService.sendInviteCode(
        trimmed,
        code,
        lang,
        inviterName,
      );
      if (sent) {
        await this.inviteRepo.update({ code }, { lastSentAt: new Date() });
      }
      return { invite, sent };
    }
    throw new BadRequestException('Failed to generate unique invite code');
  }

  async validateCode(code: string): Promise<Invite> {
    const invite = await this.inviteRepo.findOne({
      where: { code },
      relations: ['creator'],
    });
    if (!invite) throw new NotFoundException('Invalid invite code');
    const status = this.resolveStatus(invite);
    if (status === 'REVOKED')
      throw new ForbiddenException('This invite has been revoked.');
    if (status === 'EXPIRED')
      throw new ForbiddenException('This invite has expired.');
    if (status === 'ACTIVATED')
      throw new ForbiddenException('This invite has already been used.');
    return invite;
  }

  async consumeCode(code: string, userId: string): Promise<void> {
    const invite = await this.inviteRepo.findOne({ where: { code } });
    if (!invite || invite.usedAt) return;

    invite.usedById = userId;
    invite.usedAt = new Date();
    invite.status = 'ACTIVATED';
    await this.inviteRepo.save(invite);
  }

  /** List all invites sent by user with effective status, sent date, expiration. remaining = 3 - pending count. */
  async getMyInvites(userId: string) {
    const invites = await this.inviteRepo.find({
      where: { creatorId: userId },
      order: { createdAt: 'DESC' },
    });
    const list = invites.map((i) => ({
      code: i.code,
      email: i.email,
      status: this.resolveStatus(i),
      sentAt: i.createdAt,
      expiresAt: i.expiresAt,
      lastSentAt: i.lastSentAt,
    }));
    const pendingCount = list.filter((x) => x.status === 'PENDING').length;
    const remaining = Math.max(0, INVITE_LIMIT_PER_USER - pendingCount);
    return { invites: list, remaining };
  }

  /** Resend invitation email. Cooldown 1 hour since lastSentAt. */
  async resend(
    userId: string,
    code: string,
    lang: string = 'en',
  ): Promise<{ sent: boolean }> {
    const invite = await this.inviteRepo.findOne({
      where: { code, creatorId: userId },
      relations: ['creator'],
    });
    if (!invite) throw new NotFoundException('Invite not found');
    const status = this.resolveStatus(invite);
    if (status !== 'PENDING') {
      throw new BadRequestException('Only pending invitations can be resent.');
    }
    if (!invite.email)
      throw new BadRequestException('This invite has no email.');
    const now = new Date();
    if (
      invite.lastSentAt &&
      invite.lastSentAt.getTime() + RESEND_COOLDOWN_MS > now.getTime()
    ) {
      throw new ForbiddenException(
        'Please wait at least 1 hour before resending. Try again later.',
      );
    }
    const inviterName =
      invite.creator?.displayName || invite.creator?.handle || 'A friend';
    const sent = await this.emailService.sendInviteCode(
      invite.email,
      invite.code,
      lang,
      inviterName,
    );
    if (sent) {
      await this.inviteRepo.update({ code }, { lastSentAt: now });
    }
    return { sent };
  }

  /** Revoke invitation (invalidates code immediately). */
  async revoke(userId: string, code: string): Promise<void> {
    const invite = await this.inviteRepo.findOne({
      where: { code, creatorId: userId },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    const status = this.resolveStatus(invite);
    if (status !== 'PENDING') {
      throw new BadRequestException('Only pending invitations can be revoked.');
    }
    invite.status = 'REVOKED';
    invite.revokedAt = new Date();
    await this.inviteRepo.save(invite);
  }

  /** Legacy: generate code without email (deprecated for users; admin still can). */
  async generateCode(userId?: string): Promise<string> {
    if (userId) {
      const pending = await this.inviteRepo.find({
        where: { creatorId: userId },
      });
      const pendingCount = pending.filter(
        (i) => this.resolveStatus(i) === 'PENDING',
      ).length;
      if (pendingCount >= INVITE_LIMIT_PER_USER) {
        throw new BadRequestException('No invites remaining');
      }
    }
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const exists = await this.inviteRepo.findOne({ where: { code } });
      if (exists) continue;
      await this.inviteRepo.save({
        code,
        creatorId: userId ?? null,
      });
      return code;
    }
    throw new BadRequestException('Failed to generate unique invite code');
  }

  /** Admin / backward compat: create code and send to email (no user context). */
  async createCodeAndSendToEmail(
    email: string,
    lang: string = 'en',
  ): Promise<{ code: string; sent: boolean }> {
    const trimmed = email?.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new BadRequestException('Valid email is required');
    }
    const code = await this.generateCode(undefined);
    let sent = false;
    try {
      sent = await this.emailService.sendInviteCode(trimmed, code, lang);
    } catch (err) {
      this.logger.warn(
        `Invite code email failed for ${trimmed} (code ${code} still created):`,
        err instanceof Error ? err.message : err,
      );
    }
    return { code, sent };
  }

  async addToWaitingList(email: string, ipHash?: string) {
    const existing = await this.waitingListRepo.findOne({ where: { email } });
    if (existing) return;
    if (ipHash) {
      const count = await this.waitingListRepo.count({ where: { ipHash } });
      if (count > 5)
        throw new ForbiddenException('Too many requests from this IP');
    }
    await this.waitingListRepo.save({ email, ipHash, status: 'PENDING' });
  }

  async removeFromWaitingList(email: string): Promise<void> {
    const normalized = email?.trim().toLowerCase();
    if (!normalized) return;
    await this.waitingListRepo
      .createQueryBuilder()
      .delete()
      .where('LOWER(email) = :email', { email: normalized })
      .execute();
  }
}
