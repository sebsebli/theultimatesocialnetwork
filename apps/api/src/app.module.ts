import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
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
import { KeepsModule } from './keeps/keeps.module';
import { RealtimeModule } from './realtime/realtime.module';
import { CleanupService } from './cleanup/cleanup.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RssModule } from "./rss/rss.module";
import { Post } from './entities/post.entity';
import { User } from './entities/user.entity';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
        transport: process.env.NODE_ENV !== 'production' ? {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        } : undefined,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env', // Load from root
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl: 60000,
          limit: 100,
        }],
        storage: new ThrottlerStorageRedisService(config.get<string>('REDIS_URL') || 'redis://localhost:6379'),
      }),
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([Post, User]), // For CleanupService
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
    KeepsModule,
    RealtimeModule,
    RssModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    CleanupService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
