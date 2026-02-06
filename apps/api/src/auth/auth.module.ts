import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { SessionsController } from './sessions.controller';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { NotificationPref } from '../entities/notification-pref.entity';
import { InvitesModule } from '../invites/invites.module';
import { SharedModule } from '../shared/shared.module';
import { SearchModule } from '../search/search.module';
import Redis from 'ioredis';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    TypeOrmModule.forFeature([User, Session, NotificationPref]), // User needed by JwtStrategy for banned check
    InvitesModule,
    SharedModule,
    SearchModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // ConfigService first (from .env when local), then process.env (e.g. Docker-injected)
        const fromConfig = configService.get<string>('JWT_SECRET');
        const fromEnv = process.env.JWT_SECRET;
        const secret = (fromConfig ?? fromEnv ?? '').trim();
        const fallback = 'your-secret-key-change-in-production';
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        if (isProduction) {
          if (!secret || secret === fallback) {
            throw new Error(
              'JWT_SECRET must be set and must not be the default in production. Set JWT_SECRET in .env or environment.',
            );
          }
        }
        if (!secret) {
          console.warn(
            '[AuthModule] JWT_SECRET not set; using default. Set in .env or Docker env for production.',
          );
          return { secret: fallback, signOptions: { expiresIn: '15m' } };
        }
        return { secret, signOptions: { expiresIn: '15m' } };
      },
    }),
  ],
  controllers: [AuthController, SessionsController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (!redisUrl) {
          throw new Error('REDIS_URL is not configured');
        }
        return new Redis(redisUrl);
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
