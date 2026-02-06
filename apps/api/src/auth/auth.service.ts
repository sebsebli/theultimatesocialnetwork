import {
  Injectable,
  UnauthorizedException,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { randomInt, randomBytes, createHash } from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- otplib v2 flat API
const otplib = require('otplib') as {
  generateSecret: () => string;
  generateURI: (opts: {
    issuer: string;
    label: string;
    secret: string;
    type: string;
  }) => string;
  verifySync: (opts: { token: string; secret: string }) => { valid: boolean };
};

import { InvitesService } from '../invites/invites.service';
import { EmailService } from '../shared/email.service';
import { ConfigService } from '@nestjs/config';
import { MeilisearchService } from '../search/meilisearch.service';

/** Max failed login attempts before lockout. */
const MAX_LOGIN_ATTEMPTS = 5;
/** Lockout durations in minutes (exponential backoff). */
const LOCKOUT_MINUTES = [1, 5, 15, 30, 60];
/** Number of backup codes generated for 2FA recovery. */
const BACKUP_CODE_COUNT = 10;

/** Hash a string with SHA-256. */
function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    private jwtService: JwtService,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private invitesService: InvitesService,
    private emailService: EmailService,
    private configService: ConfigService,
    private meilisearch: MeilisearchService,
  ) {}

  async login(email: string, inviteCode?: string, lang: string = 'en') {
    // 1. Account lockout check
    const user = await this.userRepo.findOne({ where: { email } });

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new BadRequestException(
        `Account temporarily locked. Try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`,
      );
    }

    // 2. Check Invite (Beta Logic)
    const isBeta = await this.invitesService.isBetaMode();

    if (!user && isBeta) {
      if (!inviteCode) {
        throw new BadRequestException('Invite code required for registration');
      }
      await this.invitesService.validateCode(inviteCode);
    }

    // 3. Rate Limit (1 per minute)
    const rateKey = `rate:auth:${email}`;
    const limited = await this.redis.get(rateKey);
    if (limited) {
      throw new BadRequestException('Please wait before sending another code');
    }

    // 4. Generate 6-digit Token
    const token = randomInt(100000, 1000000).toString(); // Max is exclusive
    const key = `auth:${email}`;

    // 5. Store Token + InviteCode (15 min expiration)
    const data = JSON.stringify({ token, inviteCode });
    await this.redis.set(key, data, 'EX', 900);
    await this.redis.set(rateKey, '1', 'EX', 60);

    // Reset attempts on new code generation
    await this.redis.del(`auth:attempts:${email}`);

    // 6. Send Email (localized)
    await this.emailService.sendSignInToken(email, token, lang);

    return { success: true, message: 'Verification code sent' };
  }

  async verifyToken(
    email: string,
    token: string,
    _lang?: string,
    sessionMeta?: { ipAddress?: string; deviceInfo?: string },
  ) {
    // Dev backdoor: accept configured dev token in non-production even when Redis has a code
    // (e.g. agents call login then verify with CITE_DEV_TOKEN; login stores a new code, so we must accept dev token here)
    if (this.configService.get('NODE_ENV') !== 'production') {
      const devToken = this.configService.get<string>('DEV_TOKEN') ?? '123456';
      if (token && token === devToken) {
        // Retrieve invite code from Redis if available (stored during login)
        let storedInviteCode: string | undefined;
        try {
          const storedData = await this.redis.get(`auth:${email}`);
          if (storedData) {
            const parsed = JSON.parse(storedData) as { inviteCode?: string };
            storedInviteCode = parsed.inviteCode;
          }
        } catch {
          /* ignore parse errors */
        }
        const user = await this.validateOrCreateUser(email, storedInviteCode);
        await this.resetLoginAttempts(user.id);
        return this.generateTokens(user, sessionMeta);
      }
    }

    const key = `auth:${email}`;
    const attemptsKey = `auth:attempts:${email}`;

    // Check attempts
    const attempts = await this.redis.incr(attemptsKey);
    if (attempts === 1) {
      await this.redis.expire(attemptsKey, 900); // 15 min expiry matches token
    }
    if (attempts > 5) {
      // Record failed login attempt for lockout
      await this.recordFailedLoginAttempt(email);
      throw new UnauthorizedException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    const storedData = await this.redis.get(key);

    if (!storedData) {
      throw new UnauthorizedException('Code expired or not found');
    }

    let inviteCode: string | undefined;
    let isValid = false;

    try {
      const parsed = JSON.parse(storedData) as unknown as {
        token: string;
        inviteCode?: string;
      };
      if (parsed.token === token) {
        isValid = true;
        inviteCode = parsed.inviteCode;
      }
    } catch {
      if (storedData === token) isValid = true;
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    const user = await this.validateOrCreateUser(email, inviteCode);
    // Reset lockout on successful verification
    await this.resetLoginAttempts(user.id);

    // 2FA Check
    if (user.twoFactorEnabled) {
      // Clear used token since we verified it
      await this.redis.del(key);
      await this.redis.del(attemptsKey);

      // Return temp token for 2FA step
      const tempPayload = { sub: user.id, email: user.email, isPartial: true };
      return {
        twoFactorRequired: true,
        tempToken: this.jwtService.sign(tempPayload, { expiresIn: '5m' }),
      };
    }

    const tokens = await this.generateTokens(user, sessionMeta);

    // Clear used token and attempts after success
    await this.redis.del(key);
    await this.redis.del(attemptsKey);

    return tokens;
  }

  // --- Account Lockout ---

  private async recordFailedLoginAttempt(email: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ['id', 'failedLoginAttempts'],
    });
    if (!user) return;

    const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
    const updates: Partial<User> = { failedLoginAttempts: newAttempts };

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutIdx = Math.min(
        Math.floor((newAttempts - MAX_LOGIN_ATTEMPTS) / MAX_LOGIN_ATTEMPTS),
        LOCKOUT_MINUTES.length - 1,
      );
      const lockoutMinutes = LOCKOUT_MINUTES[lockoutIdx];
      const lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      updates.lockedUntil = lockedUntil;
      this.logger.warn(
        `Account locked for ${lockoutMinutes}min: ${email} (${newAttempts} failed attempts)`,
      );
    }

    await this.userRepo.update(user.id, updates);
  }

  private async resetLoginAttempts(userId: string): Promise<void> {
    await this.userRepo.update(userId, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  async validateOrCreateUser(
    email: string,
    inviteCode?: string,
    skipBetaCheck = false,
  ): Promise<User> {
    let user = await this.userRepo.findOne({ where: { email } });

    // Check if new user
    if (!user) {
      // Re-check Beta Mode (race condition safety)
      const isBeta = await this.invitesService.isBetaMode();
      if (!skipBetaCheck && isBeta && !inviteCode) {
        throw new BadRequestException('Registration requires invite code');
      }

      // Create new user with placeholder profile; real handle/displayName set in onboarding
      const id = uuidv4();
      const publicId = randomBytes(9)
        .toString('base64')
        .replace(/\+/g, '.')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 12);
      const placeholderHandle = `__pending_${id.replace(/-/g, '').slice(0, 12)}`;
      user = this.userRepo.create({
        id,
        email,
        publicId,
        handle: placeholderHandle,
        displayName: 'Pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        invitesRemaining: 3,
        onboardingCompletedAt: null,
      });
      user = await this.userRepo.save(user);

      // Consume invite code
      if (inviteCode) {
        await this.invitesService.consumeCode(inviteCode, user.id);
      }

      // Remove from waiting list when user signs up (if they were on it)
      await this.invitesService.removeFromWaitingList(email);
    }

    return user;
  }

  async generateTokens(
    user: User,
    sessionMeta?: { ipAddress?: string; deviceInfo?: string },
  ) {
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days (refresh token lifetime)

    const payload = {
      sub: user.id,
      email: user.email,
      sessionId,
      role: user.role,
    };
    // Short-lived access token (15 minutes)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Long-lived refresh token (7 days) — opaque random token
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshTokenHash = sha256(refreshToken);

    // Store Session (device/browser and IP for "Where you're signed in")
    await this.sessionRepo.save({
      id: sessionId,
      userId: user.id,
      tokenHash: accessToken.slice(-10), // Store partial hash for revocation
      refreshTokenHash,
      ipAddress: sessionMeta?.ipAddress ?? null,
      deviceInfo: sessionMeta?.deviceInfo ?? null,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  /** Refresh access token using a valid refresh token. Issues new access + refresh tokens (rotation). */
  async refreshAccessToken(
    refreshToken: string,
    sessionMeta?: { ipAddress?: string; deviceInfo?: string },
  ) {
    const hash = sha256(refreshToken);
    const session = await this.sessionRepo.findOne({
      where: { refreshTokenHash: hash, expiresAt: MoreThan(new Date()) },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findOne({
      where: { id: session.userId },
      select: ['id', 'email', 'handle', 'displayName', 'role', 'bannedAt'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.bannedAt) {
      // Revoke session if user is banned
      await this.sessionRepo.delete({ id: session.id });
      throw new UnauthorizedException('Account has been suspended');
    }

    // Rotate: generate new access + refresh tokens, update session
    const payload = {
      sub: user.id,
      email: user.email,
      sessionId: session.id,
      role: user.role,
    };
    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const newRefreshToken = randomBytes(48).toString('base64url');
    const newRefreshTokenHash = sha256(newRefreshToken);

    // Update session with new refresh token hash and touch last active
    session.refreshTokenHash = newRefreshTokenHash;
    session.tokenHash = newAccessToken.slice(-10);
    session.lastActiveAt = new Date();
    if (sessionMeta?.ipAddress) session.ipAddress = sessionMeta.ipAddress;
    if (sessionMeta?.deviceInfo) session.deviceInfo = sessionMeta.deviceInfo;
    await this.sessionRepo.save(session);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  /** Revoke a specific session's refresh token (logout). */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const hash = sha256(refreshToken);
    await this.sessionRepo.delete({ refreshTokenHash: hash });
  }

  // --- 2FA Methods ---

  async generate2FASecret(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'handle'],
    });
    if (!user) throw new UnauthorizedException();

    const secret = otplib.generateSecret();
    const accountName =
      (user.email && user.email.trim()) ||
      (user.handle && user.handle.trim()) ||
      user.id ||
      'user';
    const otpauthUrl = otplib.generateURI({
      issuer: 'Citewalk',
      label: accountName,
      secret,
      type: 'totp',
    });

    return { secret, otpauthUrl };
  }

  /** Generate backup codes for 2FA recovery. Returns plain codes (show once to user). */
  private generateBackupCodes(): {
    plainCodes: string[];
    hashedCodes: { hash: string; used: boolean }[];
  } {
    const plainCodes: string[] = [];
    const hashedCodes: { hash: string; used: boolean }[] = [];
    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
      const code = randomBytes(4).toString('hex'); // 8 hex chars
      plainCodes.push(code);
      hashedCodes.push({ hash: sha256(code), used: false });
    }
    return { plainCodes, hashedCodes };
  }

  async enable2FA(userId: string, token: string, secret: string) {
    const isValid = otplib.verifySync({ token, secret }).valid;
    if (!isValid) throw new BadRequestException('Invalid TOTP code');

    // Generate backup codes
    const { plainCodes, hashedCodes } = this.generateBackupCodes();

    await this.userRepo.update(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: hashedCodes,
    });
    return { success: true, backupCodes: plainCodes };
  }

  async verify2FALogin(
    userId: string,
    token: string,
    sessionMeta?: { ipAddress?: string; deviceInfo?: string },
  ) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.handle',
        'user.displayName',
        'user.role',
        'user.twoFactorEnabled',
      ])
      .addSelect('user.twoFactorSecret')
      .addSelect('user.twoFactorBackupCodes')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA not enabled or user not found');
    }

    // Try TOTP verification first
    const isValid = otplib.verifySync({
      token,
      secret: user.twoFactorSecret,
    }).valid;

    if (!isValid) {
      // Try backup code
      const backupUsed = await this.tryBackupCode(
        userId,
        token,
        user.twoFactorBackupCodes,
      );
      if (!backupUsed) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    return this.generateTokens(user, sessionMeta);
  }

  /** Attempt to use a backup code. Returns true if valid and consumed. */
  private async tryBackupCode(
    userId: string,
    code: string,
    backupCodes: { hash: string; used: boolean }[] | null,
  ): Promise<boolean> {
    if (!backupCodes || backupCodes.length === 0) return false;

    const codeHash = sha256(code.trim().toLowerCase());
    const idx = backupCodes.findIndex((bc) => bc.hash === codeHash && !bc.used);
    if (idx === -1) return false;

    // Mark as used
    backupCodes[idx].used = true;
    await this.userRepo.update(userId, {
      twoFactorBackupCodes: backupCodes,
    });

    this.logger.warn(`Backup code used for user ${userId} (code index ${idx})`);
    return true;
  }

  /** Regenerate backup codes (requires valid 2FA token). */
  async regenerateBackupCodes(userId: string, token: string) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.twoFactorEnabled'])
      .addSelect('user.twoFactorSecret')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }
    const isValid = otplib.verifySync({
      token,
      secret: user.twoFactorSecret,
    }).valid;
    if (!isValid) throw new BadRequestException('Invalid TOTP code');

    const { plainCodes, hashedCodes } = this.generateBackupCodes();
    await this.userRepo.update(userId, { twoFactorBackupCodes: hashedCodes });
    return { success: true, backupCodes: plainCodes };
  }

  async disable2FA(userId: string, token: string) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.twoFactorEnabled'])
      .addSelect('user.twoFactorSecret')
      .addSelect('user.twoFactorBackupCodes')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Try TOTP first, then backup code
    const isValid = otplib.verifySync({
      token,
      secret: user.twoFactorSecret,
    }).valid;
    if (!isValid) {
      const backupUsed = await this.tryBackupCode(
        userId,
        token,
        user.twoFactorBackupCodes,
      );
      if (!backupUsed)
        throw new BadRequestException('Invalid TOTP or backup code');
    }

    await this.userRepo.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    });
    return { success: true };
  }
}
