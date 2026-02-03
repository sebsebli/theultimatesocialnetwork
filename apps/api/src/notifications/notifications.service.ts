import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { isPendingUser } from '../shared/is-pending-user';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
  ) {}

  async findAll(userId: string) {
    const notifications = await this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
      // Use implicit joins if relations are defined, otherwise simple manual mapping is fine,
      // but let's assume no relations are defined on the entity yet based on previous file reads.
      // Actually, standard practice is to join. Let's do a manual efficient fetch if relations aren't there.
      // Checking the code, I see "Enrich with actor and post data".
      // Let's use Promise.all is okay for small batches (50), but let's optimize to batched loading
      // if we can't change the entity structure right now.
      // But actually, the best way without changing entity files is to collect IDs and fetch in bulk.
    });

    if (notifications.length === 0) return [];

    const actorIds = [
      ...new Set(notifications.map((n) => n.actorUserId).filter(Boolean)),
    ];
    const postIds = [
      ...new Set(notifications.map((n) => n.postId).filter(Boolean)),
    ];

    const [actors, posts] = await Promise.all([
      actorIds.length > 0 ? this.userRepo.findByIds(actorIds) : [],
      postIds.length > 0 ? this.postRepo.findByIds(postIds) : [],
    ]);

    const actorMap = new Map(actors.map((u) => [u.id, u]));
    const postMap = new Map(posts.map((p) => [p.id, p]));

    return notifications.map((notif) => {
      const actor = notif.actorUserId ? actorMap.get(notif.actorUserId) : null;
      return {
        ...notif,
        actor: actor && !isPendingUser(actor) ? actor : null,
        post: notif.postId ? postMap.get(notif.postId) : null,
      };
    });
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
