import { Module, Global } from '@nestjs/common';
import { GraphComputeService } from './graph-compute.service';
import { DatabaseModule } from '../database/database.module';
import { SharedModule } from '../shared/shared.module';

/**
 * GraphModule — Periodic graph feature computation.
 *
 * Computes derived features from Neo4j every 15 minutes:
 * - Post authority (PageRank-like)
 * - User influence (followers + citation impact)
 * - Trending velocity (citation rate)
 * - Topic clusters (co-citation analysis)
 *
 * Global so GraphComputeService can be injected anywhere.
 */
@Global()
@Module({
  imports: [DatabaseModule, SharedModule],
  providers: [GraphComputeService],
  exports: [GraphComputeService],
})
export class GraphModule {}
