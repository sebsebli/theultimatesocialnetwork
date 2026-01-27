import {
  Controller,
  Post,
  Get,
  Body,
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

  @Post('generate') // User generating invite
  @UseGuards(AuthGuard('jwt'))
  async generate(@CurrentUser() user: { id: string }) {
    const isBeta = await this.invitesService.isBetaMode();
    if (!isBeta) {
      throw new BadRequestException(
        'Invite generation is disabled (Beta Over)',
      );
    }

    // Check remaining
    const status = await this.invitesService.getMyInvites(user.id);
    if (status.remaining <= 0) {
      throw new BadRequestException('No invites remaining');
    }

    const code = await this.invitesService.generateCode(user.id);
    return { code };
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMy(@CurrentUser() user: { id: string }) {
    return this.invitesService.getMyInvites(user.id);
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
