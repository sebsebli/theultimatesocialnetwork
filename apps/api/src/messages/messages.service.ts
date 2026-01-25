import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DmThread } from '../entities/dm-thread.entity';
import { DmMessage } from '../entities/dm-message.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { NotificationHelperService } from '../shared/notification-helper.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(DmThread) private threadRepo: Repository<DmThread>,
    @InjectRepository(DmMessage) private messageRepo: Repository<DmMessage>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    private notificationHelper: NotificationHelperService,
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
        throw new ForbiddenException('Must follow each other or have prior interaction');
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
    await this.notificationHelper.createNotification({
      userId: recipientId,
      type: 'DM' as any,
      actorUserId: userId,
    });

    return savedMessage;
  }

  async getThreads(userId: string) {
    const threads = await this.threadRepo.find({
      where: [{ userA: userId }, { userB: userId }],
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      threads.map(async (thread) => {
        const otherUserId = thread.userA === userId ? thread.userB : thread.userA;
        const otherUser = await this.userRepo.findOne({
          where: { id: otherUserId },
        });

        const lastMessage = await this.messageRepo.findOne({
          where: { threadId: thread.id },
          order: { createdAt: 'DESC' },
        });

        const unreadCount = await this.messageRepo.count({
          where: {
            threadId: thread.id,
            senderId: otherUserId,
          },
        });

        return {
          id: thread.id,
          otherUser,
          lastMessage,
          unreadCount,
          createdAt: thread.createdAt,
        };
      })
    );
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
