import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PushService } from './push.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('me/push-tokens')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async register(@CurrentUser() user: { id: string }, @Body() dto: RegisterPushTokenDto) {
    await this.pushService.register(user.id, dto);
    return { ok: true };
  }
}