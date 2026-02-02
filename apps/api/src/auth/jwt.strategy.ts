import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
  ) {
    const secret =
      configService.get<string>('JWT_SECRET') ??
      process.env.JWT_SECRET ??
      'your-secret-key-change-in-production';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
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
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
