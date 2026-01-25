import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Driver;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get<string>('NEO4J_URI') || 'bolt://localhost:7687';
    const user = this.configService.get<string>('NEO4J_USER') || 'neo4j';
    const password = this.configService.get<string>('NEO4J_PASSWORD') || 'password';

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    
    // Verify connection
    try {
      await this.driver.getServerInfo();
      console.log('Connected to Neo4j');
    } catch (e) {
      console.error('Failed to connect to Neo4j', e);
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }

  getSession(): Session {
    return this.driver.session();
  }

  async run(query: string, params: Record<string, any> = {}) {
    const session = this.getSession();
    try {
      const result = await session.run(query, params);
      return result;
    } finally {
      await session.close();
    }
  }
}
