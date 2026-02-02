import {
  Controller,
  Get,
  Inject,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import type { Request } from 'express';
import { Neo4jService } from './database/neo4j.service';
import { MeilisearchService } from './search/meilisearch.service';

/** When set, full GET /health (DB/Redis details) requires X-Health-Secret or request from private IP. */
function isDetailedHealthAllowed(req: Request): boolean {
  const secret = process.env.HEALTH_SECRET;
  if (!secret) return true;
  const provided = req.headers['x-health-secret'];
  const match = typeof provided === 'string' && provided === secret;
  if (match) return true;
  const ip = (req.ip || req.socket?.remoteAddress || '').trim();
  const isPrivate =
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') ||
    ip.startsWith('192.168.');
  return isPrivate;
}

@Controller('health')
@Throttle({ default: { limit: 60, ttl: 60000 } }) // 60/min per IP (enough for LB health checks; limits recon scanning)
export class HealthController {
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

    const result: {
      status: string;
      timestamp: string;
      services: {
        database: string;
        redis: string;
        neo4j: string;
        meilisearch: string;
      };
    } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        redis: 'unknown',
        neo4j: 'unknown',
        meilisearch: 'unknown',
      },
    };

    try {
      await this.dataSource.query('SELECT 1');
      result.services.database = 'up';
    } catch {
      result.services.database = 'down';
      result.status = 'error';
    }

    try {
      await this.redis.ping();
      result.services.redis = 'up';
    } catch {
      result.services.redis = 'down';
      result.status = 'error';
    }

    try {
      const neo4jStatus = this.neo4j.getStatus();
      result.services.neo4j = neo4jStatus.healthy ? 'up' : 'down';
    } catch {
      result.services.neo4j = 'down';
    }

    try {
      await this.meilisearch.health();
      result.services.meilisearch = 'up';
    } catch {
      result.services.meilisearch = 'down';
    }

    if (result.status === 'error') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}
