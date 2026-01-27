import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

const DEFAULT_DEV_SECRET = 'dev-admin-change-me';

/**
 * Guard that allows access when the request has header X-Admin-Key
 * equal to CITE_ADMIN_SECRET.
 *
 * Security notes:
 * - Use a long, random secret in production (e.g. 32+ chars).
 * - Prefer HTTPS so the header is not sent in plaintext.
 * - In production, the default "dev-admin-change-me" is rejected.
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const secret = this.configService.get<string>('CITE_ADMIN_SECRET');
    const key = req.headers['x-admin-key'];
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (!secret) {
      throw new UnauthorizedException(
        'Admin key auth is not configured (CITE_ADMIN_SECRET)',
      );
    }
    if (isProduction && secret === DEFAULT_DEV_SECRET) {
      throw new UnauthorizedException(
        'Admin key must be changed in production (do not use dev-admin-change-me)',
      );
    }
    if (typeof key !== 'string' || key !== secret) {
      throw new UnauthorizedException('Invalid or missing X-Admin-Key');
    }
    return true;
  }
}
