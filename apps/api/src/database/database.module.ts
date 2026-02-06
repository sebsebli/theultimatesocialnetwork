import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Neo4jService } from './neo4j.service';
import { Neo4jQueryService } from './neo4j-query.service';
// ... other imports

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const primaryUrl = configService.get<string>('DATABASE_URL');
        // Read replicas: comma-separated URLs in DATABASE_REPLICAS env var.
        // When set, TypeORM routes SELECT queries to replicas automatically.
        // Example: DATABASE_REPLICAS=postgres://user:pass@replica1:5432/db,postgres://user:pass@replica2:5432/db
        const replicaUrls = configService.get<string>('DATABASE_REPLICAS');

        const sslConfig =
          configService.get('DB_SSL') === 'false'
            ? false
            : isProduction
              ? {
                  rejectUnauthorized: true,
                  ca: configService.get<string>('DB_CA_CERT'),
                }
              : false;

        const poolExtra = {
          // Connection pool: match PgBouncer capacity for zero-wait connections
          max: 80,
          min: 10,
          // Timeouts
          statement_timeout: 30000, // 30s per statement
          idle_in_transaction_session_timeout: 10000, // 10s idle transaction
          // Connection health
          idleTimeoutMillis: 30000, // Close idle connections after 30s
          connectionTimeoutMillis: 5000, // Fail fast on connection acquire (5s)
        };

        // Build base config (shared between single and replication modes)
        const baseConfig: Record<string, any> = {
          type: 'postgres' as const,
          autoLoadEntities: true,
          synchronize:
            configService.get('DB_SYNCHRONIZE') !== undefined
              ? configService.get('DB_SYNCHRONIZE') === 'true'
              : !isProduction,
          logging: !isProduction,
          // In production, run migrations via entrypoint.sh (TypeORM CLI) before app start.
          // migrationsRun is disabled here to avoid race conditions in multi-instance deployments.
          migrationsRun: false,
          extra: poolExtra,
        };

        // Replication mode: write to primary, read from replicas
        if (replicaUrls) {
          const replicas = replicaUrls
            .split(',')
            .map((url: string) => url.trim())
            .filter(Boolean)
            .map((url: string) => ({ url, ssl: sslConfig }));

          if (replicas.length > 0) {
            return {
              ...baseConfig,
              replication: {
                master: { url: primaryUrl, ssl: sslConfig },
                slaves: replicas,
              },
            };
          }
        }

        // Single-instance mode (default)
        return {
          ...baseConfig,
          url: primaryUrl,
          ssl: sslConfig,
        };
      },
    }),
  ],
  providers: [Neo4jService, Neo4jQueryService],
  exports: [TypeOrmModule, Neo4jService, Neo4jQueryService],
})
export class DatabaseModule {}
