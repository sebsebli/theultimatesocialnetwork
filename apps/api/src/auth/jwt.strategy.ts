import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret =
      configService.get<string>('JWT_SECRET') ??
      configService.get<string>('SUPABASE_JWT_SECRET') ??
      process.env.JWT_SECRET ??
      process.env.SUPABASE_JWT_SECRET ??
      'your-secret-key-change-in-production';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: { sub: string; email: string }) {
    // Supabase JWT payload: { sub: 'uuid', email: '...', ... }
    return { id: payload.sub, email: payload.email };
  }
}
