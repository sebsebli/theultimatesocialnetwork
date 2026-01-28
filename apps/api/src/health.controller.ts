import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

@Controller('health')
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
    } catch (e) {
      status.services.database = 'down';
      status.status = 'error';
    }

    try {
      await this.redis.ping();
      status.services.redis = 'up';
    } catch (e) {
      status.services.redis = 'down';
      status.status = 'error';
    }

    if (status.status === 'error') {
      throw new ServiceUnavailableException(status);
    }

    return status;
  }
}
