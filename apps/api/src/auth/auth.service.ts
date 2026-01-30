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
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { randomInt } from 'crypto';

import { InvitesService } from '../invites/invites.service';
import { EmailService } from '../shared/email.service';
import { ConfigService } from '@nestjs/config';
import { MeilisearchService } from '../search/meilisearch.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
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

  async verifyToken(email: string, token: string) {
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
      // Check for dev backdoor
      if (token === '123456' && process.env.NODE_ENV !== 'production') {
        const user = await this.validateOrCreateUser(email);
        return this.generateTokens(user);
      }
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
    const tokens = this.generateTokens(user);

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
      const placeholderHandle = `__pending_${id.replace(/-/g, '').slice(0, 12)}`;
      user = this.userRepo.create({
        id,
        email,
        handle: placeholderHandle,
        displayName: 'Pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        invitesRemaining: 3,
        onboardingCompletedAt: null,
      });
      user = await this.userRepo.save(user);

      // Index user in search only after they complete onboarding (real handle)
      // Placeholder users (__pending_*) are not indexed

      // Consume invite code
      if (inviteCode) {
        await this.invitesService.consumeCode(inviteCode, user.id);
      }

      // Remove from waiting list when user signs up (if they were on it)
      await this.invitesService.removeFromWaitingList(email);
    }

    return user;
  }

  generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        displayName: user.displayName,
      },
    };
  }
}
