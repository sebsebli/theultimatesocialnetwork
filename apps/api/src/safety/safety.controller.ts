import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SafetyService } from './safety.service';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('block/:userId')
  @UseGuards(AuthGuard('jwt'))
  async block(
    @CurrentUser() user: { id: string },
    @Param('userId', ParseUUIDPipe) blockedId: string,
  ) {
    return this.safetyService.block(user.id, blockedId);
  }

  @Delete('block/:userId')
  @UseGuards(AuthGuard('jwt'))
  async unblock(
    @CurrentUser() user: { id: string },
    @Param('userId', ParseUUIDPipe) blockedId: string,
  ) {
    return this.safetyService.unblock(user.id, blockedId);
  }

  @Post('mute/:userId')
  @UseGuards(AuthGuard('jwt'))
  async mute(
    @CurrentUser() user: { id: string },
    @Param('userId', ParseUUIDPipe) mutedId: string,
  ) {
    return this.safetyService.mute(user.id, mutedId);
  }

  @Delete('mute/:userId')
  @UseGuards(AuthGuard('jwt'))
  async unmute(
    @CurrentUser() user: { id: string },
    @Param('userId', ParseUUIDPipe) mutedId: string,
  ) {
    return this.safetyService.unmute(user.id, mutedId);
  }

  @Post('report')
  @UseGuards(AuthGuard('jwt'))
  async report(
    @CurrentUser() user: { id: string },
    @Body()
    dto: {
      targetId: string;
      targetType: string;
      reason: string;
      comment?: string;
    },
  ) {
    return this.safetyService.report(
      user.id,
      dto.targetId,
      dto.targetType,
      dto.reason,
      dto.comment,
    );
  }

  @Get('blocked')
  @UseGuards(AuthGuard('jwt'))
  async getBlocked(@CurrentUser() user: { id: string }) {
    return this.safetyService.getBlocked(user.id);
  }

  @Get('muted')
  @UseGuards(AuthGuard('jwt'))
  async getMuted(@CurrentUser() user: { id: string }) {
    return this.safetyService.getMuted(user.id);
  }
}
