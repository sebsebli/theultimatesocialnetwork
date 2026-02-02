import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminKeyGuard } from '../invites/admin-key.guard';
import type { SeedAgentDto, SeedAgentResult } from './admin-agents.service';
import { AdminAgentsService } from './admin-agents.service';

/**
 * Admin endpoint to seed agent users directly in the DB (no signup/tokenization).
 * Creates user, indexes in Meilisearch, creates Neo4j user node, returns JWT.
 * Requires X-Admin-Key header (CITE_ADMIN_SECRET).
 */
@Controller('admin/agents')
@UseGuards(AdminKeyGuard)
export class AdminAgentsController {
  constructor(private readonly adminAgentsService: AdminAgentsService) {}

  @Post('seed')
  async seed(@Body() body: SeedAgentDto): Promise<SeedAgentResult> {
    return this.adminAgentsService.seedAgent(body);
  }

  @Post('token')
  async token(@Body() body: { email: string }): Promise<SeedAgentResult> {
    return this.adminAgentsService.getTokenForEmail(body.email);
  }
}
