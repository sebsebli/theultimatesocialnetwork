import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvitesService } from './invites.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { AdminKeyGuard } from './admin-key.guard';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  /** Send invitation by email (beta only). Email required; code generated and sent. */
  @Post('send')
  @UseGuards(AuthGuard('jwt'))
  async send(
    @CurrentUser() user: { id: string },
    @Body() body: { email: string; lang?: string },
  ) {
    const email = body?.email?.trim();
    if (!email) throw new BadRequestException('Email is required');
    return this.invitesService.sendByEmail(user.id, email, body.lang ?? 'en');
  }

  /** Beta mode: when true, email invite codes are used; when false, referral links only. */
  @Get('beta-mode')
  @UseGuards(AuthGuard('jwt'))
  async getBetaMode() {
    const betaMode = await this.invitesService.isBetaMode();
    return { betaMode };
  }

  /** Referral link for sharing (post-beta). Uses app base URL and user handle. */
  @Get('referral-link')
  @UseGuards(AuthGuard('jwt'))
  async getReferralLink(@CurrentUser() user: { id: string }) {
    return this.invitesService.getReferralLink(user.id);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMy(@CurrentUser() user: { id: string }) {
    return this.invitesService.getMyInvites(user.id);
  }

  @Post(':code/resend')
  @UseGuards(AuthGuard('jwt'))
  async resend(
    @CurrentUser() user: { id: string },
    @Param('code') code: string,
    @Body() body: { lang?: string },
  ) {
    return this.invitesService.resend(user.id, code, body?.lang ?? 'en');
  }

  @Post(':code/revoke')
  @UseGuards(AuthGuard('jwt'))
  async revoke(
    @CurrentUser() user: { id: string },
    @Param('code') code: string,
  ) {
    await this.invitesService.revoke(user.id, code);
    return { success: true };
  }
}

@Controller('admin')
export class AdminInvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  /**
   * Generate a new system invite code (admin key required).
   * Example: curl -X POST .../admin/invites/generate-code -H "X-Admin-Key: YOUR_SECRET"
   */
  @Post('invites/generate-code')
  @UseGuards(AdminKeyGuard)
  async generateInviteCode() {
    const code = await this.invitesService.generateCode(undefined);
    return { code };
  }

  /**
   * Create a system invite code and email it to the given address (admin key required).
   * Body: { "email": "user@example.com", "lang": "en" } — lang optional, defaults to "en".
   */
  @Post('invites/send-to-email')
  @UseGuards(AdminKeyGuard)
  async sendInviteToEmail(@Body() body: { email: string; lang?: string }) {
    return this.invitesService.createCodeAndSendToEmail(
      body.email ?? '',
      body.lang ?? 'en',
    );
  }

  /** Generate system invite (JWT). Kept for backward compatibility. */
  @Post('invites/system')
  @UseGuards(AuthGuard('jwt'))
  async generateSystemInvite() {
    const code = await this.invitesService.generateCode(undefined);
    return { code };
  }

  /** Set beta mode (admin key required). Body: { "enabled": true|false } */
  @Post('set-beta')
  @UseGuards(AdminKeyGuard)
  async setBetaMode(@Body() body: { enabled: boolean }) {
    await this.invitesService.setBetaMode(body.enabled);
    return { success: true, betaMode: body.enabled };
  }

  /** Set beta mode (JWT). Kept for backward compatibility. */
  @Post('beta-mode')
  @UseGuards(AuthGuard('jwt'))
  async toggleBeta(@Body() body: { enabled: boolean }) {
    await this.invitesService.setBetaMode(body.enabled);
    return { success: true };
  }
}
