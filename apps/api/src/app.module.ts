import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TrustedIpThrottlerGuard } from './common/guards/trusted-ip-throttler.guard';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from './auth/auth.module';
import { FeedModule } from './feed/feed.module';
import { InteractionsModule } from './interactions/interactions.module';
import { CollectionsModule } from './collections/collections.module';
import { TopicsModule } from './topics/topics.module';
import { ExploreModule } from './explore/explore.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PushModule } from './push/push.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { SearchModule } from './search/search.module';
import { RepliesModule } from './replies/replies.module';
import { FollowsModule } from './follows/follows.module';
import { MessagesModule } from './messages/messages.module';
import { UploadModule } from './upload/upload.module';
import { SafetyModule } from './safety/safety.module';
import { AdminModule } from './admin/admin.module';
import { KeepsModule } from './keeps/keeps.module';
import { RealtimeModule } from './realtime/realtime.module';
import { CleanupService } from './cleanup/cleanup.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { User } from './entities/user.entity';
import { Notification } from './entities/notification.entity';
import { PushOutbox } from './entities/push-outbox.entity';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import * as Joi from 'joi';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- pino requires (req, res) signature
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
        transport:
          process.env.NODE_ENV !== 'production' &&
          process.env.NODE_ENV !== 'test'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                },
              }
            : undefined,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env', // Load from root
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        MEILISEARCH_HOST: Joi.string().default('http://localhost:7700'),
        MEILISEARCH_MASTER_KEY: Joi.string().default('masterKey'),
        MINIO_ENDPOINT: Joi.string().default('localhost'),
        MINIO_ACCESS_KEY: Joi.string().default('minioadmin'),
        MINIO_SECRET_KEY: Joi.string().default('minioadmin'),
        /** When set, GET /metrics requires X-Metrics-Secret or Authorization: Bearer <value>. */
        METRICS_SECRET: Joi.string().optional(),
        /** Comma-separated allowed origins. Required in production so CORS is explicit. */
        CORS_ORIGINS: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(1).required(),
          otherwise: Joi.string().optional(),
        }),
        /** Global throttle: requests per IP per window. Default 60/min for abuse mitigation. */
        THROTTLE_LIMIT: Joi.number().min(1).max(1000).default(60),
        THROTTLE_TTL_MS: Joi.number().min(1000).max(3600000).default(60000),
      }),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL_MS') ?? 60000,
            limit: config.get<number>('THROTTLE_LIMIT') ?? 60,
          },
        ],
      }),
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([Post, User, Notification, PushOutbox]), // For CleanupService
    PostsModule,
    AuthModule,
    FeedModule,
    InteractionsModule,
    CollectionsModule,
    TopicsModule,
    ExploreModule,
    NotificationsModule,
    PushModule,
    ReportsModule,
    UsersModule,
    SearchModule,
    RepliesModule,
    FollowsModule,
    MessagesModule,
    UploadModule,
    SafetyModule,
    AdminModule,
    KeepsModule,
    RealtimeModule,
    // RssModule,
    // MetadataModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    CleanupService,
    {
      provide: APP_GUARD,
      useClass: TrustedIpThrottlerGuard,
    },
  ],
})
export class AppModule {}
