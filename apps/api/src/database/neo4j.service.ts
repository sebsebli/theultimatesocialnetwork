import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Driver;
  private isHealthy = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri =
      this.configService.get<string>('NEO4J_URI') || 'bolt://localhost:7687';
    const user = this.configService.get<string>('NEO4J_USER') || 'neo4j';
    const password =
      this.configService.get<string>('NEO4J_PASSWORD') || 'password';

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

    // Verify connection with a simple ping
    try {
      await this.driver.getServerInfo();
      this.isHealthy = true;
      console.log('Connected to Neo4j');
    } catch (e) {
      this.isHealthy = false;
      const message = e instanceof Error ? e.message : String(e);
      console.error(
        'Failed to connect to Neo4j. Graph features will be disabled.',
        message,
      );
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
    if (!this.isHealthy) {
      // Best effort: if we previously failed, try one session.
      // If it fails, we keep isHealthy = false.
      // For now, return empty result to avoid blocking the caller.
      return { records: [] };
    }

    const session = this.getSession();
    try {
      const result = await session.run(query, params);
      return result;
    } catch (error) {
      this.isHealthy = false; // Mark as unhealthy on error
      throw error;
    } finally {
      await session.close();
    }
  }
}
