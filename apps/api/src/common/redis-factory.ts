import Redis, { Cluster } from 'ioredis';
import { Logger } from '@nestjs/common';

const logger = new Logger('RedisFactory');

/**
 * Creates a Redis client that supports both standalone and cluster modes.
 *
 * ## Standalone (default):
 *   REDIS_URL=redis://redis:6379
 *
 * ## Cluster (for scaling):
 *   REDIS_URL=redis://node1:6379,redis://node2:6380,redis://node3:6381
 *   Or: REDIS_CLUSTER=true with REDIS_URL containing any single node.
 *
 * In cluster mode, ioredis auto-discovers all nodes from any seed node.
 *
 * ## Scaling path:
 *   - 0–200K users: Single Redis (6GB+ RAM)
 *   - 200K+ users: Redis Cluster (3+ nodes)
 *   - 1M+ users: Redis Cluster (6+ nodes, sharded by key prefix)
 */
export function createRedisClient(
  redisUrl: string,
  isCluster?: boolean,
  options?: Record<string, any>,
): Redis | Cluster {
  const urls = redisUrl
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
  const useCluster = isCluster || urls.length > 1;

  if (useCluster) {
    const nodes = urls.map((url) => {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379', 10),
      };
    });

    logger.log(
      `Redis Cluster mode: ${nodes.length} seed node(s) — ${nodes.map((n) => `${n.host}:${n.port}`).join(', ')}`,
    );

    const password = new URL(urls[0]).password || undefined;

    return new Cluster(nodes, {
      redisOptions: {
        password,
        connectTimeout: 10000,
        commandTimeout: 5000,
        ...options,
      },
      scaleReads: 'slave', // Route reads to replicas for better throughput
      clusterRetryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
      enableReadyCheck: true,
      slotsRefreshTimeout: 5000,
    }) as Redis | Cluster; // Cluster extends Redis and is API-compatible
  }

  // Standalone mode
  logger.log(`Redis standalone mode: ${urls[0]}`);
  return new Redis(urls[0], {
    connectTimeout: 10000,
    commandTimeout: 5000,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      return Math.min(times * 50, 2000);
    },
    enableReadyCheck: true,
    lazyConnect: false,
    ...options,
  });
}
