import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';

@Injectable()
export class NotificationHelperService {
  constructor(
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
  ) {}

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    actorUserId?: string;
    postId?: string;
    replyId?: string;
    collectionId?: string;
  }) {
    // Don't notify self
    if (data.actorUserId === data.userId) {
      return;
    }

    const notification = this.notificationRepo.create(data);
    return this.notificationRepo.save(notification);
  }
}
