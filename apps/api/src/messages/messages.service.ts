import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DmThread } from '../entities/dm-thread.entity';
import { DmMessage } from '../entities/dm-message.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(DmThread) private threadRepo: Repository<DmThread>,
    @InjectRepository(DmMessage) private messageRepo: Repository<DmMessage>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    private notificationHelper: NotificationHelperService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async findOrCreateThread(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new Error('Cannot message yourself');
    }

    // Check if mutual follow or prior interaction
    const isMutualFollow = await this.followRepo.findOne({
      where: [
        { followerId: userId, followeeId: otherUserId },
        { followerId: otherUserId, followeeId: userId },
      ],
    });

    // For now, allow if either follows the other
    // In production, you might want stricter rules
    if (!isMutualFollow) {
      // Check if there's an existing thread (prior interaction)
      const existingThread = await this.threadRepo.findOne({
        where: [
          { userA: userId, userB: otherUserId },
          { userA: otherUserId, userB: userId },
        ],
      });
      if (!existingThread) {
        throw new ForbiddenException(
          'Must follow each other or have prior interaction',
        );
      }
    }

    let thread = await this.threadRepo.findOne({
      where: [
        { userA: userId, userB: otherUserId },
        { userA: otherUserId, userB: userId },
      ],
    });

    if (!thread) {
      thread = this.threadRepo.create({
        userA: userId < otherUserId ? userId : otherUserId,
        userB: userId < otherUserId ? otherUserId : userId,
      });
      thread = await this.threadRepo.save(thread);
    }

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
      type: 'DM' as any,
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
      .getRawMany();

    return (threads || []).map((t) => ({
      id: t.thread_id,
      otherUser: {
        id: t.otherUser_id,
        handle: t.otherUser_handle,
        displayName: t.otherUser_display_name,
      },
      lastMessage: t.lastMessageBody
        ? {
            body: t.lastMessageBody,
            createdAt: t.lastMessageAt,
          }
        : null,
      unreadCount: parseInt(t.unreadCount, 10) || 0,
      createdAt: t.thread_created_at,
    }));
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

    return this.messageRepo.find({
      where: { threadId },
      relations: ['thread'],
      order: { createdAt: 'ASC' },
    });
  }
}
