import { Injectable, UnauthorizedException, Inject, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private invitesService: InvitesService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async login(email: string, inviteCode?: string) {
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
    const token = randomInt(100000, 999999).toString();
    const key = `auth:${email}`;
    
    // 4. Store Token + InviteCode (15 min expiration)
    const data = JSON.stringify({ token, inviteCode });
    await this.redis.set(key, data, 'EX', 900);
    await this.redis.set(rateKey, '1', 'EX', 60);
    
    // 5. Send Email
    // Default to 'en' for now, ideally passed from controller
    await this.emailService.sendSignInToken(email, token, 'en');
    
    return { success: true, message: 'Verification code sent' };
  }

  async verifyToken(email: string, token: string) {
    const key = `auth:${email}`;
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
      const parsed = JSON.parse(storedData);
      if (parsed.token === token) {
        isValid = true;
        inviteCode = parsed.inviteCode;
      }
    } catch (e) {
      if (storedData === token) isValid = true;
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Clear used token immediately
    await this.redis.del(key);

    const user = await this.validateOrCreateUser(email, inviteCode);
    return this.generateTokens(user);
  }

  async validateOrCreateUser(email: string, inviteCode?: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { email } });
    
    // Check if new user
    if (!user) {
      // Re-check Beta Mode (race condition safety)
      const isBeta = await this.invitesService.isBetaMode();
      if (isBeta && !inviteCode) {
          throw new BadRequestException('Registration requires invite code');
      }

      // Create new user
      const handle = email.split('@')[0] + Math.floor(Math.random() * 1000);
      user = this.userRepo.create({
        id: uuidv4(),
        email,
        handle,
        displayName: handle,
        createdAt: new Date(),
        updatedAt: new Date(),
        invitesRemaining: 3, // Give 3 invites
      });
      user = await this.userRepo.save(user);

      // Consume invite code
      if (inviteCode) {
          await this.invitesService.consumeCode(inviteCode, user.id);
      }
    }

    return user;
  }

  async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        displayName: user.displayName,
      }
    };
  }
}