import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
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

  /** Get the current user's moderation history (DSA Art. 17 transparency). */
  @Get('moderation-history')
  @UseGuards(AuthGuard('jwt'))
  async getModerationHistory(
    @CurrentUser() user: { id: string },
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return this.safetyService.getUserModerationHistory(
      user.id,
      Number.isNaN(limit) ? 20 : limit,
      Number.isNaN(offset) ? 0 : offset,
    );
  }

  /** Submit an appeal for a moderation decision (DSA Art. 20). */
  @Post('appeals/:moderationRecordId')
  @UseGuards(AuthGuard('jwt'))
  async submitAppeal(
    @CurrentUser() user: { id: string },
    @Param('moderationRecordId', ParseUUIDPipe) moderationRecordId: string,
    @Body() dto: { text: string },
  ) {
    return this.safetyService.submitAppeal(
      user.id,
      moderationRecordId,
      dto.text,
    );
  }
}
