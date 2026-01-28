import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Post]), SharedModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [SharedModule],
})
export class NotificationsModule {}
