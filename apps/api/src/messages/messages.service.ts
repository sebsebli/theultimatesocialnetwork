import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DmThread } from '../entities/dm-thread.entity';
import { DmMessage } from '../entities/dm-message.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationType } from '../entities/notification.entity';
import { MeilisearchService } from '../search/meilisearch.service';
import { UploadService } from '../upload/upload.service';

interface ThreadRawResult {
  thread_id: string;
  otherUser_id: string;
  otherUser_handle: string;
  otherUser_display_name: string;
  otherUser_avatar_key: string | null;
  lastMessageBody: string;
  lastMessageAt: Date;
  unreadCount: string;
  thread_created_at: Date;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(DmThread) private threadRepo: Repository<DmThread>,
    @InjectRepository(DmMessage) private messageRepo: Repository<DmMessage>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    private notificationHelper: NotificationHelperService,
    private realtimeGateway: RealtimeGateway,
    private meilisearch: MeilisearchService,
    private uploadService: UploadService,
  ) {}

  async findOrCreateThread(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new Error('Cannot message yourself');
    }

    let thread = await this.threadRepo.findOne({
      where: [
        { userA: userId, userB: otherUserId },
        { userA: otherUserId, userB: userId },
      ],
    });

    if (thread) {
      return thread;
    }

    // New conversation: allow only if the other user follows the current user (they've opted in to contact)
    const otherFollowsMe = await this.followRepo.findOne({
      where: { followerId: otherUserId, followeeId: userId },
    });

    if (!otherFollowsMe) {
      throw new ForbiddenException(
        'You can only message people who follow you back or who you have messaged before.',
      );
    }

    thread = this.threadRepo.create({
      userA: userId < otherUserId ? userId : otherUserId,
      userB: userId < otherUserId ? otherUserId : userId,
    });
    thread = await this.threadRepo.save(thread);
    return thread;
  }

  async sendMessage(userId: string, threadId: string, body: string) {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.userA !== userId && thread.userB !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const message = this.messageRepo.create({
      threadId,
      senderId: userId,
      body,
    });

    const savedMessage = await this.messageRepo.save(message);

    // Index for chat search (participantIds so search is filtered by current user only)
    this.meilisearch
      .indexMessage(
        {
          id: savedMessage.id,
          threadId: savedMessage.threadId,
          senderId: savedMessage.senderId,
          body: savedMessage.body,
          createdAt: savedMessage.createdAt,
        },
        [thread.userA, thread.userB],
      )
      .catch(() => {});

    // Notify recipient
    const recipientId = thread.userA === userId ? thread.userB : thread.userA;

    // Emit real-time message event for chat UI
    this.realtimeGateway.sendMessage(recipientId, {
      ...savedMessage,
      threadId: thread.id,
    });

    // Create persistent notification
    await this.notificationHelper.createNotification({
      userId: recipientId,
      type: NotificationType.DM,
      actorUserId: userId,
    });

    return savedMessage;
  }

  async getThreads(userId: string) {
    // Optimized query to get threads with otherUser, lastMessage, and unreadCount in one pass
    // We use a raw query or complex QueryBuilder for this level of optimization
    const threads = await this.threadRepo
      .createQueryBuilder('thread')
      .leftJoinAndSelect(
        'users',
        'otherUser',
        'otherUser.id = CASE WHEN thread.userA = :userId THEN thread.userB ELSE thread.userA END',
        { userId },
      )
      .addSelect((subQuery) => {
        return subQuery
          .select('msg.body', 'lastMessageBody')
          .from('dm_messages', 'msg')
          .where('msg.thread_id = thread.id')
          .orderBy('msg.created_at', 'DESC')
          .limit(1);
      }, 'lastMessageBody')
      .addSelect((subQuery) => {
        return subQuery
          .select('msg.created_at', 'lastMessageAt')
          .from('dm_messages', 'msg')
          .where('msg.thread_id = thread.id')
          .orderBy('msg.created_at', 'DESC')
          .limit(1);
      }, 'lastMessageAt')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*)', 'unreadCount')
          .from('dm_messages', 'msg')
          .where('msg.thread_id = thread.id')
          .andWhere('msg.sender_id != :userId', { userId })
          .andWhere('msg.read_at IS NULL');
      }, 'unreadCount')
      .where('thread.userA = :userId OR thread.userB = :userId', { userId })
      .orderBy('thread.updatedAt', 'DESC') // Assuming threads have updatedAt
      .getRawMany<ThreadRawResult>();

    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
    const list = (threads || []).map((t) => {
      const avatarKey = t.otherUser_avatar_key ?? null;
      const avatarUrl = avatarKey ? getImageUrl(avatarKey) : null;
      return {
        id: t.thread_id,
        otherUser: {
          id: t.otherUser_id,
          handle: t.otherUser_handle,
          displayName: t.otherUser_display_name,
          avatarKey: avatarKey ?? undefined,
          avatarUrl,
        },
        lastMessage: t.lastMessageBody
          ? {
              body: t.lastMessageBody,
              createdAt: t.lastMessageAt,
              isRead: parseInt(t.unreadCount, 10) === 0,
            }
          : null,
        unreadCount: parseInt(t.unreadCount, 10) || 0,
        createdAt: t.thread_created_at,
      };
    });
    // Never show pending (pre-onboarding) users in chat list
    return list.filter((t) => !t.otherUser?.handle?.startsWith('__pending_'));
  }

  async getMessages(userId: string, threadId: string) {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.userA !== userId && thread.userB !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // Mark all messages from the other user as read when opening the thread
    const otherUserId = thread.userA === userId ? thread.userB : thread.userA;
    await this.messageRepo.update(
      { threadId, senderId: otherUserId, readAt: IsNull() },
      { readAt: new Date() },
    );

    return this.messageRepo.find({
      where: { threadId },
      relations: ['thread'],
      order: { createdAt: 'ASC' },
    });
  }

  async markThreadRead(userId: string, threadId: string, read: boolean) {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    if (thread.userA !== userId && thread.userB !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    const otherUserId = thread.userA === userId ? thread.userB : thread.userA;
    if (read) {
      await this.messageRepo.update(
        { threadId, senderId: otherUserId, readAt: IsNull() },
        { readAt: new Date() },
      );
    } else {
      await this.messageRepo.update(
        { threadId, senderId: otherUserId },
        { readAt: null },
      );
    }
  }

  async deleteThread(userId: string, threadId: string) {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    if (thread.userA !== userId && thread.userB !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    await this.messageRepo.delete({ threadId });
    await this.threadRepo.delete({ id: threadId });
  }

  /**
   * Search current user's chats. Security: only messages from threads where
   * the user is a participant are searchable; filter is applied server-side only.
   */
  async searchChats(
    userId: string,
    query: string,
    limit = 30,
  ): Promise<
    Array<{
      id: string;
      threadId: string;
      body: string;
      createdAt: string;
      otherUser: {
        id: string;
        handle: string;
        displayName: string;
        avatarKey?: string | null;
        avatarUrl?: string | null;
      };
    }>
  > {
    if (!query || !query.trim()) {
      return [];
    }
    const { hits } = await this.meilisearch.searchMessages(
      query.trim(),
      userId,
      limit,
    );
    if (hits.length === 0) return [];

    const threadIds = [...new Set(hits.map((h) => h.threadId))];
    const threads = await this.threadRepo.find({
      where: threadIds.map((id) => ({ id })),
    });
    const threadById = new Map(threads.map((t) => [t.id, t]));
    const otherUserIds = [
      ...new Set(threads.map((t) => (t.userA === userId ? t.userB : t.userA))),
    ];
    const users = await this.userRepo.find({
      where: otherUserIds.map((id) => ({ id })),
      select: ['id', 'handle', 'displayName'],
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return hits.map((h) => {
      const thread = threadById.get(h.threadId);
      const otherUserId = thread
        ? thread.userA === userId
          ? thread.userB
          : thread.userA
        : null;
      const other = otherUserId ? userById.get(otherUserId) : null;
      const avatarKey = other?.avatarKey ?? null;
      const avatarUrl = avatarKey
        ? this.uploadService.getImageUrl(avatarKey)
        : null;
      return {
        id: h.id,
        threadId: h.threadId,
        body: h.body ?? '',
        createdAt: h.createdAt ?? '',
        otherUser: other
          ? {
              id: other.id,
              handle: other.handle,
              displayName: other.displayName ?? other.handle,
              avatarKey: avatarKey ?? undefined,
              avatarUrl,
            }
          : { id: '', handle: 'unknown', displayName: 'Unknown' },
      };
    });
  }
}
