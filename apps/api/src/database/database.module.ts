import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Neo4jService } from './neo4j.service';
// ... other imports

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize:
            !isProduction || configService.get('DB_SYNCHRONIZE') === 'true', // Disable in production unless explicitly enabled
          logging: !isProduction,
          ssl:
            configService.get('DB_SSL') === 'false'
              ? false
              : isProduction
                ? {
                    rejectUnauthorized: true,
                    ca: configService.get('DB_CA_CERT'),
                  }
                : false,
        };
      },
    }),
  ],
  providers: [Neo4jService],
  exports: [TypeOrmModule, Neo4jService],
})
export class DatabaseModule {}
