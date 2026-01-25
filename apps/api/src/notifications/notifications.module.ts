import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { NotificationHelperService } from '../shared/notification-helper.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Post])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationHelperService],
  exports: [NotificationHelperService],
})
export class NotificationsModule {}
