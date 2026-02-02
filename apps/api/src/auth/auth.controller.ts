import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
import { Confirm2FADto } from './dto/confirm-2fa.dto';
import { Login2FADto } from './dto/login-2fa.dto';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../shared/current-user.decorator';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.inviteCode, dto.lang ?? 'en');
  }

  @Post('verify')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifyDto) {
    return this.authService.verifyToken(dto.email, dto.token);
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

  @Post('2fa/login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login2FA(@Body() dto: Login2FADto) {
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

    return this.authService.verify2FALogin(payload.sub, dto.token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    // Statistically stateless JWT logout, but provided for standard API compatibility
    // and potential future blacklisting or session management.
    return { success: true };
  }
}
