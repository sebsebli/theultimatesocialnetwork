import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Driver;
  private isHealthy = false;
  private lastCheck = 0;
  private readonly CHECK_INTERVAL = 30000; // 30s

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
    await this.ensureIndexes();
  }

  /** Create indexes for labels/properties used by the app (idempotent). Improves MATCH/MERGE performance. */
  private async ensureIndexes(): Promise<void> {
    if (!this.isHealthy) return;
    const indexes = [
      'CREATE INDEX user_id_idx IF NOT EXISTS FOR (u:User) ON (u.id)',
      'CREATE INDEX post_id_idx IF NOT EXISTS FOR (p:Post) ON (p.id)',
      'CREATE INDEX topic_slug_idx IF NOT EXISTS FOR (t:Topic) ON (t.slug)',
    ];
    for (const query of indexes) {
      try {
        await this.run(query);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes('equivalent') && !msg.includes('already exists')) {
          console.warn('Neo4j index creation (non-fatal):', msg);
        }
      }
    }
  }

  private async connect() {
    const uri =
      this.configService.get<string>('NEO4J_URI') || 'bolt://localhost:7687';
    const user = this.configService.get<string>('NEO4J_USER') || 'neo4j';
    const password =
      this.configService.get<string>('NEO4J_PASSWORD') || 'password';

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2000, // 2s
    });

    await this.verifyConnection();
  }

  private async verifyConnection(): Promise<boolean> {
    try {
      await this.driver.getServerInfo();
      this.isHealthy = true;
      console.log('Connected to Neo4j');
      return true;
    } catch (e) {
      this.isHealthy = false;
      const message = e instanceof Error ? e.message : String(e);
      console.error(
        'Failed to connect to Neo4j. Graph features will be disabled until reconnection.',
        message,
      );
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.driver) {
      await this.driver.close();
    }
  }

  getStatus() {
    return { healthy: this.isHealthy };
  }

  getSession(): Session {
    return this.driver.session();
  }

  async run(query: string, params: Record<string, any> = {}) {
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
        console.warn('Neo4j connection lost during query execution');
      }
      throw error;
    } finally {
      await session.close();
    }
  }
}
