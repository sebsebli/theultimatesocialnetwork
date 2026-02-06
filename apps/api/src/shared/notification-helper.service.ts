import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { IEventBus, EVENT_BUS } from '../common/event-bus/event-bus.interface';
import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { PushOutbox, PushStatus } from '../entities/push-outbox.entity';
// import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class NotificationHelperService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(PushOutbox)
    private pushOutboxRepo: Repository<PushOutbox>,
    // private realtimeGateway: RealtimeGateway,
    @Inject(EVENT_BUS) private eventBus: IEventBus,
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
    const where: Parameters<Repository<Notification>['findOne']>[0]['where'] = {
      userId: data.userId,
      type: data.type,
      actorUserId: data.actorUserId,
      postId: data.postId ?? undefined,
      replyId: data.replyId ?? undefined,
      collectionId: data.collectionId ?? undefined,
    };
    if (data.postId == null) (where as { postId?: unknown }).postId = IsNull();
    if (data.replyId == null)
      (where as { replyId?: unknown }).replyId = IsNull();
    if (data.collectionId == null)
      (where as { collectionId?: unknown }).collectionId = IsNull();
    const existing = await this.notificationRepo.findOne({ where });

    if (existing) {
      return existing;
    }

    const notification = this.notificationRepo.create(data);
    const saved = await this.notificationRepo.save(notification);

    // Realtime (Socket)
    /*
    this.realtimeGateway.sendNotification(
      data.userId,
      saved as unknown as Record<string, unknown>,
    );
    */

    // Push Notification (Async via Outbox)
    try {
      const { title, body } = await this.formatPushMessage(data);
      if (title && body) {
        const outbox = this.pushOutboxRepo.create({
          userId: data.userId,
          notifType: data.type,
          title,
          body,
          data: {
            postId: data.postId,
            actorId: data.actorUserId,
            type: data.type,
          },
          status: PushStatus.PENDING,
        });
        const savedOutbox = await this.pushOutboxRepo.save(outbox);

        await this.eventBus.publish('push-processing', 'send', {
          id: savedOutbox.id,
        });
      }
    } catch (e) {
      console.error('Failed to queue push notification', e);
    }

    return saved;
  }

  private async formatPushMessage(data: {
    userId: string;
    type: NotificationType;
    actorUserId?: string;
  }): Promise<{ title: string; body: string } | { title: null; body: null }> {
    let actorName = 'Someone';
    if (data.actorUserId) {
      const actor = await this.userRepo.findOne({
        where: { id: data.actorUserId },
      });
      if (actor) {
        actorName = actor.displayName || actor.handle;
      }
    }

    switch (data.type) {
      case NotificationType.FOLLOW:
        return {
          title: 'New Follower',
          body: `${actorName} started following you.`,
        };
      case NotificationType.FOLLOW_REQUEST:
        return {
          title: 'Follow Request',
          body: `${actorName} requested to follow you.`,
        };
      case NotificationType.REPLY:
        return {
          title: 'New Reply',
          body: `${actorName} replied to your post.`,
        };
      case NotificationType.QUOTE:
        return {
          title: 'New Quote',
          body: `${actorName} quoted your post.`,
        };
      case NotificationType.MENTION:
        return {
          title: 'New Mention',
          body: `${actorName} mentioned you.`,
        };
      case NotificationType.LIKE:
        // Likes are private/quiet usually, often no push
        return { title: null, body: null };
      case NotificationType.MODERATION:
        return {
          title: 'Content Moderation Notice',
          body: 'One of your posts was removed for a guideline violation. Open to see details and appeal.',
        };
      default:
        return { title: null, body: null };
    }
  }
}
