import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../shared/current-user.decorator';
import { ReportStatus } from '../entities/report.entity';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { BanUserDto } from './dto/ban-user.dto';

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();
  return req.ip ?? req.socket?.remoteAddress;
}

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('reports')
  @Roles('admin', 'moderator')
  async getReports(
    @Query('status') status?: ReportStatus,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ) {
    return this.adminService.getReports(status, limit, offset);
  }

  @Patch('reports/:id')
  @Roles('admin', 'moderator')
  async resolveReport(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveReportDto,
    @Req() req: Request,
  ) {
    const result = await this.adminService.resolveReport(id, dto.status);
    await this.adminService.logAction(
      user.id, 'resolve_report', 'report', id,
      { status: dto.status }, getClientIp(req),
    );
    return result;
  }

  @Post('users/:id/ban')
  @Roles('admin')
  async banUser(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BanUserDto,
    @Req() req: Request,
  ) {
    return this.adminService.banUser(id, dto.reason, user.id, getClientIp(req));
  }

  @Post('users/:id/unban')
  @Roles('admin')
  async unbanUser(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.adminService.unbanUser(id, user.id, getClientIp(req));
  }

  /** Trigger full reindex from PostgreSQL to Meilisearch (users, topics, posts, messages). Runs in background. */
  @Post('search/reindex')
  @Roles('admin')
  async triggerSearchReindex(
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    await this.adminService.logAction(
      user.id, 'reindex_search', 'system', null, null, getClientIp(req),
    );
    return this.adminService.triggerSearchReindex();
  }

  /** Rebuild Neo4j graph from PostgreSQL. Runs in background. */
  @Post('graph/rebuild')
  @Roles('admin')
  async triggerGraphRebuild(
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    await this.adminService.logAction(
      user.id, 'rebuild_graph', 'system', null, null, getClientIp(req),
    );
    return this.adminService.triggerGraphRebuild();
  }

  /** Recompute derived graph features (authority, influence, trending, clusters). */
  @Post('graph/compute')
  @Roles('admin')
  async triggerGraphCompute(
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    await this.adminService.logAction(
      user.id, 'compute_graph_features', 'system', null, null, getClientIp(req),
    );
    return this.adminService.triggerGraphCompute();
  }

  /** Get admin audit logs. */
  @Get('audit-logs')
  @Roles('admin')
  async getAuditLogs(
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ) {
    return this.adminService.getAuditLogs(limit, offset);
  }
}
