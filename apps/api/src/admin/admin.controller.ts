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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ReportStatus } from '../entities/report.entity';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { BanUserDto } from './dto/ban-user.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.adminService.resolveReport(id, dto.status);
  }

  @Post('users/:id/ban')
  @Roles('admin')
  async banUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.banUser(id, dto.reason);
  }

  @Post('users/:id/unban')
  @Roles('admin')
  async unbanUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unbanUser(id);
  }

  /** Trigger full reindex from PostgreSQL to Meilisearch (users, topics, posts, messages). Runs in background. */
  @Post('search/reindex')
  @Roles('admin')
  triggerSearchReindex() {
    return this.adminService.triggerSearchReindex();
  }

  /** Rebuild Neo4j graph from PostgreSQL (all non-deleted posts: User, Post, AUTHORED, IN_TOPIC, LINKS_TO, QUOTES, MENTIONS). Use after restoring posts or if graph is out of sync. Runs in background. */
  @Post('graph/rebuild')
  @Roles('admin')
  triggerGraphRebuild() {
    return this.adminService.triggerGraphRebuild();
  }
}
