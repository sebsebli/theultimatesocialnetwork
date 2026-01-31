import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

@Controller('health')
@Throttle({ default: { limit: 60, ttl: 60000 } }) // 60/min per IP (enough for LB health checks; limits recon scanning)
export class HealthController {
  constructor(
    private dataSource: DataSource,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  @Get()
  async check() {
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    try {
      await this.dataSource.query('SELECT 1');
      status.services.database = 'up';
    } catch {
      status.services.database = 'down';
      status.status = 'error';
    }

    try {
      await this.redis.ping();
      status.services.redis = 'up';
    } catch {
      status.services.redis = 'down';
      status.status = 'error';
    }

    if (status.status === 'error') {
      throw new ServiceUnavailableException(status);
    }

    return status;
  }
}
