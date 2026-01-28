import {
  Controller,
  Post,
  Body,
  Ip,
  BadRequestException,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import * as crypto from 'crypto';

@Controller('waiting-list')
export class WaitingListController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  async join(@Body() body: { email: string }, @Ip() ip: string) {
    if (!body.email || !body.email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }
    // Hash IP for privacy
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
    await this.invitesService.addToWaitingList(body.email, ipHash);
    return { message: 'Joined waiting list' };
  }
}
