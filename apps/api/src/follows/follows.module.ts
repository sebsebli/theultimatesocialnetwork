import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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
  providers: [FollowsService, FollowWorker],
  exports: [FollowsService],
})
export class FollowsModule {}
