import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Neo4jService — fully optional graph database layer.
 *
 * When NEO4J_URI is not set (or empty), Neo4j is completely disabled:
 *   - No driver is created, no connection is attempted.
 *   - All write operations (`run`) silently return `{ records: [] }`.
 *   - `getStatus()` returns `{ healthy: false, enabled: false }`.
 *
 * This allows the rest of the application (workers, admin, health checks)
 * to function without Neo4j being present at all.
 */
@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);
  private driver: import('neo4j-driver').Driver | null = null;
  private isHealthy = false;
  private lastCheck = 0;
  private readonly CHECK_INTERVAL = 30000; // 30s

  /** True only when NEO4J_URI is configured and the driver was created. */
  private readonly enabled: boolean;
  private readonly uri: string;
  private readonly user: string;
  private readonly password: string;

  constructor(private configService: ConfigService) {
    const uri = this.configService.get<string>('NEO4J_URI');
    this.enabled = !!uri && uri.trim().length > 0;
    this.uri = uri || '';
    this.user = this.configService.get<string>('NEO4J_USER') || 'neo4j';
    this.password = this.configService.get<string>('NEO4J_PASSWORD') || 'password';
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.log('Neo4j is disabled (NEO4J_URI not set). All graph operations will be skipped.');
      return;
    }
    await this.connect();
    await this.ensureIndexes();
  }

  /** Create indexes for labels/properties used by the app (idempotent). */
  private async ensureIndexes(): Promise<void> {
    if (!this.isHealthy) return;
    const indexes = [
      'CREATE INDEX user_id_idx IF NOT EXISTS FOR (u:User) ON (u.id)',
      'CREATE INDEX post_id_idx IF NOT EXISTS FOR (p:Post) ON (p.id)',
      'CREATE INDEX topic_slug_idx IF NOT EXISTS FOR (t:Topic) ON (t.slug)',
      'CREATE INDEX external_url_url_idx IF NOT EXISTS FOR (u:ExternalUrl) ON (u.url)',
    ];
    for (const query of indexes) {
      try {
        await this.run(query);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes('equivalent') && !msg.includes('already exists')) {
          this.logger.warn(`Neo4j index creation (non-fatal): ${msg}`);
        }
      }
    }
  }

  private async connect() {
    // Dynamic import so that neo4j-driver is not loaded when disabled
    const neo4j = await import('neo4j-driver');
    this.driver = neo4j.default.driver(
      this.uri,
      neo4j.default.auth.basic(this.user, this.password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2000, // 2s
      },
    );
    await this.verifyConnection();
  }

  private async verifyConnection(): Promise<boolean> {
    if (!this.driver) return false;
    try {
      await this.driver.getServerInfo();
      this.isHealthy = true;
      this.logger.log('Connected to Neo4j');
      return true;
    } catch (e) {
      this.isHealthy = false;
      const message = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `Failed to connect to Neo4j. Graph sync will be skipped until reconnection. ${message}`,
      );
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.driver) {
      await this.driver.close();
    }
  }

  /** Returns health status. `enabled: false` means Neo4j is not configured. */
  getStatus(): { healthy: boolean; enabled: boolean } {
    return { healthy: this.isHealthy, enabled: this.enabled };
  }

  /** Whether Neo4j is configured and connected. Use to skip optional operations. */
  isEnabled(): boolean {
    return this.enabled;
  }

  getSession(): import('neo4j-driver').Session | null {
    return this.driver?.session() ?? null;
  }

  async run(query: string, params: Record<string, any> = {}): Promise<{ records: any[] }> {
    // If Neo4j is not configured at all, silently skip
    if (!this.enabled || !this.driver) {
      return { records: [] };
    }

    // Self-healing: Try to reconnect if unhealthy and interval passed
    if (!this.isHealthy) {
      const now = Date.now();
      if (now - this.lastCheck > this.CHECK_INTERVAL) {
        this.lastCheck = now;
        const connected = await this.verifyConnection();
        if (!connected) {
          return { records: [] };
        }
      } else {
        return { records: [] };
      }
    }

    const session = this.getSession();
    if (!session) return { records: [] };

    try {
      const result = await session.run(query, params);
      return result;
    } catch (error) {
      // If it's a connection error, mark unhealthy
      if (
        error instanceof Error &&
        (error.message.includes('Connection') ||
          error.message.includes('Session'))
      ) {
        this.isHealthy = false;
        this.logger.warn('Neo4j connection lost during query execution');
      }
      throw error;
    } finally {
      await session.close();
    }
  }
}
