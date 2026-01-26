import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageDetectionService } from './language-detection.service';
import { NotificationHelperService } from './notification-helper.service';
import { EmailService } from './email.service';
import { Notification } from '../entities/notification.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Post, User]), RealtimeModule],
  providers: [LanguageDetectionService, NotificationHelperService, EmailService],
  exports: [LanguageDetectionService, NotificationHelperService, EmailService],
})
export class SharedModule {}
