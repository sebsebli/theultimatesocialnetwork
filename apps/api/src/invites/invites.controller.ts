import { Controller, Post, Get, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvitesService } from './invites.service';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('generate') // User generating invite
  @UseGuards(AuthGuard('jwt'))
  async generate(@CurrentUser() user: { id: string }) {
    const isBeta = await this.invitesService.isBetaMode();
    if (!isBeta) {
       throw new BadRequestException('Invite generation is disabled (Beta Over)');
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

    // Internal endpoint for me to create codes
    // Needs Admin Guard (skipping for this prototype, checking a secret header or similar)
    // Or just Authenticated for now (assuming dev user is admin)
    @Post('invites/system')
    @UseGuards(AuthGuard('jwt'))
    async generateSystemInvite() {
        const code = await this.invitesService.generateCode(undefined); // System invite
        return { code };
    }

    @Post('beta-mode')
    @UseGuards(AuthGuard('jwt'))
    async toggleBeta(@Body() body: { enabled: boolean }) {
        await this.invitesService.setBetaMode(body.enabled);
        return { success: true };
    }
}
