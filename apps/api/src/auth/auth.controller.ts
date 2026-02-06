import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
import { Confirm2FADto } from './dto/confirm-2fa.dto';
import { Disable2FADto } from './dto/disable-2fa.dto';
import { Login2FADto } from './dto/login-2fa.dto';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../shared/current-user.decorator';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();
  if (Array.isArray(forwarded) && forwarded[0])
    return String(forwarded[0]).split(',')[0]?.trim();
  return req.ip ?? req.socket?.remoteAddress;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) { }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.inviteCode, dto.lang ?? 'en');
  }

  @Post('verify')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async verify(@Req() req: Request, @Body() dto: VerifyDto) {
    const ipAddress = getClientIp(req);
    const deviceInfo = dto.deviceInfo?.trim() || undefined;
    return this.authService.verifyToken(dto.email, dto.token, undefined, {
      ipAddress,
      deviceInfo,
    });
  }

  /** Refresh access token using a valid refresh token. Issues new access + refresh (rotation). */
  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Body() body: { refreshToken: string; deviceInfo?: string },
  ) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    const ipAddress = getClientIp(req);
    const deviceInfo = body.deviceInfo?.trim() || undefined;
    return this.authService.refreshAccessToken(body.refreshToken, {
      ipAddress,
      deviceInfo,
    });
  }

  @Post('2fa/setup')
  @UseGuards(AuthGuard('jwt'))
  async setup2FA(@CurrentUser() user: User) {
    return this.authService.generate2FASecret(user.id);
  }

  @Post('2fa/confirm')
  @UseGuards(AuthGuard('jwt'))
  async confirm2FA(@CurrentUser() user: User, @Body() dto: Confirm2FADto) {
    return this.authService.enable2FA(user.id, dto.token, dto.secret);
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard('jwt'))
  async disable2FA(@CurrentUser() user: User, @Body() dto: Disable2FADto) {
    return this.authService.disable2FA(user.id, dto.token);
  }

  /** Regenerate 2FA backup codes. Requires a valid TOTP token. */
  @Post('2fa/backup-codes')
  @UseGuards(AuthGuard('jwt'))
  async regenerateBackupCodes(
    @CurrentUser() user: User,
    @Body() body: { token: string },
  ) {
    return this.authService.regenerateBackupCodes(user.id, body.token);
  }

  @Post('2fa/login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login2FA(@Req() req: Request, @Body() dto: Login2FADto) {
    // Verify temp token manually since it's not a full session token
    let payload: { isPartial?: boolean; sub?: string };
    try {
      payload = this.jwtService.verify(dto.tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired temp token');
    }

    if (!payload.isPartial || !payload.sub) {
      throw new UnauthorizedException('Invalid token type');
    }

    const ipAddress = getClientIp(req);
    const deviceInfo = dto.deviceInfo?.trim() || undefined;
    return this.authService.verify2FALogin(payload.sub, dto.token, {
      ipAddress,
      deviceInfo,
    });
  }

  /** Logout: revoke the refresh token so the session cannot be refreshed. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { refreshToken?: string }) {
    if (body.refreshToken) {
      await this.authService.revokeRefreshToken(body.refreshToken);
    }
    return { success: true };
  }
}
