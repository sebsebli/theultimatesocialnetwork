import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Neo4jService } from './neo4j.service';
import { User } from '../entities/user.entity';
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
          synchronize: !isProduction, // Disable in production
          logging: !isProduction,
          ssl:
            configService.get('DB_SSL') === 'false'
              ? false
              : isProduction
                ? { rejectUnauthorized: false }
                : false,
        };
      },
    }),
  ],
  providers: [Neo4jService],
  exports: [TypeOrmModule, Neo4jService],
})
export class DatabaseModule {}
