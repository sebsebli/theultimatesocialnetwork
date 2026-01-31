import { Controller, Post, Body, Ip } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InvitesService } from './invites.service';
import { JoinWaitingListDto } from './dto/join-waiting-list.dto';
import * as crypto from 'crypto';

@Controller('waiting-list')
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 signups per IP per minute (abuse / DDoS prevention)
export class WaitingListController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  async join(@Body() body: JoinWaitingListDto, @Ip() ip: string) {
    // Hash IP for privacy
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
    await this.invitesService.addToWaitingList(body.email.trim(), ipHash);
    return { message: 'Joined waiting list' };
  }
}
