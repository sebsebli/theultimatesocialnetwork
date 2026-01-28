import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';
import { FollowWorker } from './follow.worker';
import { Follow } from '../entities/follow.entity';
import { FollowRequest } from '../entities/follow-request.entity';
import { User } from '../entities/user.entity';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Follow, FollowRequest, User]),
    ConfigModule,
    DatabaseModule,
    NotificationsModule,
    SharedModule,
  ],
  controllers: [FollowsController],
  providers: [
    FollowsService,
    FollowWorker,
    {
      provide: 'FOLLOW_QUEUE',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return new Queue('follow-processing', { 
            connection: new Redis(redisUrl || 'redis://redis:6379', { maxRetriesPerRequest: null }) 
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [FollowsService],
})
export class FollowsModule {}