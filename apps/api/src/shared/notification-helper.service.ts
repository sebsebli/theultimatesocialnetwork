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

    // Prevent duplicates
    const existing = await this.notificationRepo.findOne({
      where: {
        userId: data.userId,
        type: data.type,
        actorUserId: data.actorUserId,
        postId: data.postId || undefined,
        replyId: data.replyId || undefined,
        collectionId: data.collectionId || undefined,
      } as any,
    });

    if (existing) {
      // Update timestamp to bump it? Or just ignore?
      // Usually better to ignore to prevent spam, or update 'updatedAt' if you have it.
      // For now, simple dedupe:
      return existing;
    }

    const notification = this.notificationRepo.create(data);
    return this.notificationRepo.save(notification);
  }
}
