import {
  Controller,
  Get,
  Inject,
  Logger,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import type { Request } from 'express';
import { Neo4jService } from './database/neo4j.service';
import { MeilisearchService } from './search/meilisearch.service';

/** Per-check timeout to prevent health endpoint from hanging. */
const CHECK_TIMEOUT_MS = 5000;

/** Race a promise against a timeout; resolves to false if timed out. */
function withTimeout<T>(
  promise: Promise<T>,
  ms = CHECK_TIMEOUT_MS,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Health check timed out')), ms),
    ),
  ]);
}

/** When set, full GET /health (DB/Redis details) requires X-Health-Secret or request from private IP. */
function isDetailedHealthAllowed(req: Request): boolean {
  const secret = process.env.HEALTH_SECRET;
  if (!secret) return true;
  const provided = req.headers['x-health-secret'];
  const match = typeof provided === 'string' && provided === secret;
  if (match) return true;
  const ip = (req.ip || req.socket?.remoteAddress || '').trim();
  // Comprehensive private IP detection including full 172.16-31.x.x range
  const isPrivate =
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('::ffff:127.') ||
    ip.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith('192.168.');
  return isPrivate;
}

@Controller('health')
@Throttle({ default: { limit: 60, ttl: 60000 } }) // 60/min per IP (enough for LB health checks; limits recon scanning)
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private dataSource: DataSource,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private neo4j: Neo4jService,
    private meilisearch: MeilisearchService,
  ) {}

  /** Liveness: process is up. No DB/Redis checks. Use for K8s livenessProbe / external LB. */
  @Get('live')
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }

  /** Readiness: when HEALTH_SECRET is set, full details only with X-Health-Secret or from private IP. */
  @Get()
  async check(@Req() req: Request) {
    const allowDetails = isDetailedHealthAllowed(req);

    if (!allowDetails) {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    }

    const neo4jStatus = this.neo4j.getStatus();
    const neo4jEnabled = neo4jStatus.enabled;

    const result: {
      status: string;
      timestamp: string;
      uptime: number;
      services: Record<string, string>;
    } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services: {
        database: 'unknown',
        redis: 'unknown',
        meilisearch: 'unknown',
      },
    };

    // Only include Neo4j in health checks when it's configured
    if (neo4jEnabled) {
      result.services.neo4j = 'unknown';
    }

    // Run all checks in parallel with individual timeouts
    const checks: Promise<unknown>[] = [
      withTimeout(this.dataSource.query('SELECT 1')),
      withTimeout(this.redis.ping()),
      withTimeout(this.meilisearch.health()),
    ];
    if (neo4jEnabled) {
      checks.push(Promise.resolve(neo4jStatus));
    }

    const results = await Promise.allSettled(checks);

    result.services.database =
      results[0].status === 'fulfilled' ? 'up' : 'down';
    result.services.redis = results[1].status === 'fulfilled' ? 'up' : 'down';
    result.services.meilisearch =
      results[2].status === 'fulfilled' ? 'up' : 'down';
    if (neo4jEnabled) {
      const neo4jResult = results[3];
      result.services.neo4j =
        neo4jResult.status === 'fulfilled' &&
        (neo4jResult.value as { healthy?: boolean })?.healthy
          ? 'up'
          : 'down';
    }

    // Log failures for debugging (exclude disabled services)
    const downServices = Object.entries(result.services)
      .filter(([, v]) => v === 'down')
      .map(([k]) => k);
    if (downServices.length > 0) {
      result.status = 'error';
      this.logger.warn(`Health check failures: ${downServices.join(', ')}`);
    }

    if (result.status === 'error') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}
