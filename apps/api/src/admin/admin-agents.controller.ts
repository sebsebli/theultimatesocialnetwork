import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminKeyGuard } from '../invites/admin-key.guard';
import type { SeedAgentDto, SeedAgentResult } from './admin-agents.service';
import { AdminAgentsService } from './admin-agents.service';
import { AdminService } from './admin.service';

/**
 * Admin endpoint to seed agent users directly in the DB (no signup/tokenization).
 * Creates user, indexes in Meilisearch, creates Neo4j user node, returns JWT.
 * Requires X-Admin-Key header (CITE_ADMIN_SECRET).
 */
@Controller('admin/agents')
@UseGuards(AdminKeyGuard)
export class AdminAgentsController {
  constructor(
    private readonly adminAgentsService: AdminAgentsService,
    private readonly adminService: AdminService,
  ) {}

  @Post('seed')
  async seed(@Body() body: SeedAgentDto): Promise<SeedAgentResult> {
    return this.adminAgentsService.seedAgent(body);
  }

  @Post('token')
  async token(@Body() body: { email: string }): Promise<SeedAgentResult> {
    return this.adminAgentsService.getTokenForEmail(body.email);
  }

  /** List agent users (email @agents.local) for --resume-from-db. */
  @Get()
  async list(): Promise<
    { email: string; handle: string; displayName: string; bio: string }[]
  > {
    return this.adminAgentsService.listAgentUsers();
  }

  /**
   * Rebuild Meilisearch indices and Neo4j graph from PostgreSQL.
   * Use after restoring soft-deleted posts or when search/graph is out of sync.
   * Requires X-Admin-Key header. Both run in background.
   */
  @Post('rebuild-indices')
  rebuildIndices(): {
    message: string;
    search: string;
    graph: string;
  } {
    const search = this.adminService.triggerSearchReindex();
    const graph = this.adminService.triggerGraphRebuild();
    return {
      message:
        'Meilisearch reindex and Neo4j graph rebuild started in background.',
      search: search.message,
      graph: graph.message,
    };
  }
}
