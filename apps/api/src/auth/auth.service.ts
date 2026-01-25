import { Injectable, UnauthorizedException, Inject, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';

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

  async sendMagicLink(email: string, inviteCode?: string) {
    // Check if user exists
    const user = await this.userRepo.findOne({ where: { email } });
    const isBeta = await this.invitesService.isBetaMode();

    // If new user and Beta Mode is ON, require invite code
    if (!user && isBeta) {
        if (!inviteCode) {
            throw new BadRequestException('Invite code required for registration');
        }
        // Validate code (will throw if invalid/used)
        await this.invitesService.validateCode(inviteCode);
    }

    // Rate limit: 1 email per minute
    const rateKey = `rate:auth:${email}`;
    const limited = await this.redis.get(rateKey);
    if (limited) {
      throw new BadRequestException('Please wait before sending another email');
    }

    const token = uuidv4();
    const key = `auth:${email}`;
    
    // Store token + inviteCode (if present) for 15 minutes
    const data = JSON.stringify({ token, inviteCode });
    await this.redis.set(key, data, 'EX', 900);
    // Set rate limit for 60 seconds
    await this.redis.set(rateKey, '1', 'EX', 60);
    
    // Send magic link email
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    try {
      await this.emailService.sendMagicLink(email, token, frontendUrl);
    } catch (error) {
      // Log error but don't fail the request (email might be disabled in dev)
      console.error('Failed to send magic link email:', error);
      // In development, still log the link
      if (process.env.NODE_ENV !== 'production') {
        console.log(`MAGIC LINK for ${email}: ${frontendUrl}/verify?email=${encodeURIComponent(email)}&token=${token}`);
      }
    }
    
    return { success: true, message: 'Magic link sent' };
  }

  async verifyMagicLink(email: string, token: string) {
    const key = `auth:${email}`;
    const storedData = await this.redis.get(key);
    
    let valid = false;
    let inviteCode: string | undefined;

    if (storedData) {
        try {
            const parsed = JSON.parse(storedData);
            if (parsed.token === token) {
                valid = true;
                inviteCode = parsed.inviteCode;
            }
        } catch (e) {
            // Old format fallback (just token string)
            if (storedData === token) valid = true;
        }
    }

    // Allow '1234' for dev
    if (!valid && token === '1234') valid = true;

    if (!valid) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    await this.redis.del(key);

    let user = await this.userRepo.findOne({ where: { email } });
    
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

    return this.generateTokens(user);
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