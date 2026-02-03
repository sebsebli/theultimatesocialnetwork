import {
  Injectable,
  UnauthorizedException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { randomInt, randomBytes } from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- otplib has no ESM types
const { authenticator } = require('otplib') as {
  authenticator: {
    generateSecret: () => string;
    keyuri: (user: string, service: string, secret: string) => string;
    verify: (opts: { token: string; secret: string }) => boolean;
  };
};

import { InvitesService } from '../invites/invites.service';
import { EmailService } from '../shared/email.service';
import { ConfigService } from '@nestjs/config';
import { MeilisearchService } from '../search/meilisearch.service';

@Injectable()
export class AuthService {
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
    // 1. Check Invite (Beta Logic)
    const user = await this.userRepo.findOne({ where: { email } });
    const isBeta = await this.invitesService.isBetaMode();

    if (!user && isBeta) {
      if (!inviteCode) {
        throw new BadRequestException('Invite code required for registration');
      }
      await this.invitesService.validateCode(inviteCode);
    }

    // 2. Rate Limit (1 per minute)
    const rateKey = `rate:auth:${email}`;
    const limited = await this.redis.get(rateKey);
    if (limited) {
      throw new BadRequestException('Please wait before sending another code');
    }

    // 3. Generate 6-digit Token
    const token = randomInt(100000, 1000000).toString(); // Max is exclusive
    const key = `auth:${email}`;

    // 4. Store Token + InviteCode (15 min expiration)
    const data = JSON.stringify({ token, inviteCode });
    await this.redis.set(key, data, 'EX', 900);
    await this.redis.set(rateKey, '1', 'EX', 60);

    // Reset attempts on new code generation
    await this.redis.del(`auth:attempts:${email}`);

    // 5. Send Email (localized)
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
        const user = await this.validateOrCreateUser(email);
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

  async validateOrCreateUser(
    email: string,
    inviteCode?: string,
  ): Promise<User> {
    let user = await this.userRepo.findOne({ where: { email } });

    // Check if new user
    if (!user) {
      // Re-check Beta Mode (race condition safety)
      const isBeta = await this.invitesService.isBetaMode();
      if (isBeta && !inviteCode) {
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
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const payload = {
      sub: user.id,
      email: user.email,
      sessionId,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    // Store Session (device/browser and IP for "Where you're signed in")
    await this.sessionRepo.save({
      id: sessionId,
      userId: user.id,
      tokenHash: accessToken.slice(-10), // Store partial hash or full if needed for revocation
      ipAddress: sessionMeta?.ipAddress ?? null,
      deviceInfo: sessionMeta?.deviceInfo ?? null,
      expiresAt,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        displayName: user.displayName,
        role: user.role, // Added role
      },
    };
  }

  // --- 2FA Methods ---

  async generate2FASecret(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'handle'],
    });
    if (!user) throw new UnauthorizedException();

    /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment -- otplib from require() */
    const secret = authenticator.generateSecret();
    const accountName =
      (user.email && user.email.trim()) ||
      (user.handle && user.handle.trim()) ||
      user.id ||
      'user';
    const otpauthUrl = authenticator.keyuri(accountName, 'Citewalk', secret);

    return { secret, otpauthUrl };
  }

  async enable2FA(userId: string, token: string, secret: string) {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- otplib */
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) throw new BadRequestException('Invalid TOTP code');

    await this.userRepo.update(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
    });
    return { success: true };
  }

  async verify2FALogin(
    userId: string,
    token: string,
    sessionMeta?: { ipAddress?: string; deviceInfo?: string },
  ) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'handle',
        'displayName',
        'role',
        'twoFactorEnabled',
        'twoFactorSecret',
      ],
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA not enabled or user not found');
    }

    /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- otplib */
    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });
    if (!isValid) throw new UnauthorizedException('Invalid 2FA code');

    return this.generateTokens(user, sessionMeta);
  }
}
