import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
  ) {}

  async findAll(userId: string) {
    const notifications = await this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    // Enrich with actor and post data
    return Promise.all(
      notifications.map(async (notif) => {
        const enriched: any = { ...notif };
        
        if (notif.actorUserId) {
          const actor = await this.userRepo.findOne({ where: { id: notif.actorUserId } });
          enriched.actor = actor;
        }
        
        if (notif.postId) {
          const post = await this.postRepo.findOne({ where: { id: notif.postId } });
          enriched.post = post;
        }
        
        return enriched;
      })
    );
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });

    if (notification && !notification.readAt) {
      notification.readAt = new Date();
      await this.notificationRepo.save(notification);
    }

    return notification;
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: new Date() })
      .where('user_id = :userId AND read_at IS NULL', { userId })
      .execute();
  }
}