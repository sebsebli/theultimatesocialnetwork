import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    const secret =
      configService.get<string>('JWT_SECRET') ?? process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: JWT_SECRET must be set in production. Refusing to start with default secret.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'dev-secret-do-not-use-in-production',
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role?: string;
    sessionId?: string;
  }) {
    // If token has a session ID, verify it exists and is active
    if (payload.sessionId) {
      const session = await this.sessionRepo.findOne({
        where: { id: payload.sessionId },
        cache: 60000, // Cache 1 min to avoid hammering DB on every single request
      });

      if (!session) {
        throw new UnauthorizedException('Session has been revoked');
      }

      // Check session expiry
      if (session.expiresAt && session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session has expired');
      }
    }

    // Check if user is banned (cache this check for 1 min)
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      select: ['id', 'bannedAt'],
      cache: 60000,
    });
    if (user?.bannedAt) {
      throw new UnauthorizedException('Account has been suspended');
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
