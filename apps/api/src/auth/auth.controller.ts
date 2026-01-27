import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.inviteCode, dto.lang ?? 'en');
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifyDto) {
    return this.authService.verifyToken(dto.email, dto.token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    // Statistically stateless JWT logout, but provided for standard API compatibility
    // and potential future blacklisting or session management.
    return { success: true };
  }
}
