import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SafetyService } from './safety.service';
import { AdminKeyGuard } from '../invites/admin-key.guard';
import {
  ModerationReasonCode,
  ModerationSource,
} from '../entities/moderation-record.entity';

@Controller('admin/moderation')
@UseGuards(AdminKeyGuard)
export class SafetyAdminController {
  constructor(private readonly safetyService: SafetyService) {}

  /**
   * List moderation records. Query: authorId, reasonCode, source, limit, offset.
   * Requires X-Admin-Key header (CITE_ADMIN_SECRET).
   */
  @Get('records')
  async getRecords(
    @Query('authorId') authorId?: string,
    @Query('reasonCode') reasonCode?: ModerationReasonCode,
    @Query('source') source?: ModerationSource,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr != null ? parseInt(limitStr, 10) : undefined;
    const offset = offsetStr != null ? parseInt(offsetStr, 10) : undefined;
    return this.safetyService.getModerationRecords({
      authorId: authorId || undefined,
      reasonCode: reasonCode || undefined,
      source: source || undefined,
      limit: Number.isNaN(limit) ? undefined : limit,
      offset: Number.isNaN(offset) ? undefined : offset,
    });
  }

  /**
   * Moderation stats for a user (total violations, by reason, suggestPermanentBan).
   * Use for permanent-ban escalation decisions.
   */
  @Get('by-author/:userId')
  async getByAuthor(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.safetyService.getModerationStatsByAuthor(userId);
  }
}
