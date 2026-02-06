import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import { INestApplicationContext, Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private adapterConstructor: any = null;
  private readonly logger = new Logger(RedisIoAdapter.name);
  private usingRedis = false;

  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    try {
      const pubClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries: number) => Math.min(retries * 200, 10000),
          connectTimeout: 10000,
          keepAlive: true,
        },
      });

      const subClient = pubClient.duplicate();

      // Critical: attach error handlers BEFORE connecting to prevent process crash
      pubClient.on('error', (err: Error) => {
        this.logger.error(`Redis WS pub error: ${err.message}`);
      });
      subClient.on('error', (err: Error) => {
        this.logger.error(`Redis WS sub error: ${err.message}`);
      });

      await Promise.all([pubClient.connect(), subClient.connect()]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.adapterConstructor = createAdapter(pubClient as RedisClientType, subClient as RedisClientType);
      this.usingRedis = true;
      this.logger.log(`WebSocket adapter: Redis (${redisUrl})`);
    } catch (err) {
      this.logger.warn(
        `Redis WebSocket adapter failed, using in-memory adapter: ${(err as Error).message}`,
      );
      this.adapterConstructor = null;
      this.usingRedis = false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createIOServer(port: number, options?: ServerOptions): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      server.adapter(this.adapterConstructor);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return server;
  }
}
