import { Injectable, BadRequestException, NotFoundException, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from '../entities/block.entity';
import { Mute } from '../entities/mute.entity';
import { Report } from '../entities/report.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';

import { ContentModerationService } from './content-moderation.service';

@Injectable()
export class SafetyService {
  constructor(
    @InjectRepository(Block) private blockRepo: Repository<Block>,
    @InjectRepository(Mute) private muteRepo: Repository<Mute>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
    @Optional() @Inject(ContentModerationService) private contentModeration?: ContentModerationService,
  ) {}

  private isValidUUID(uuid: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }

  async block(blockerId: string, blockedId: string) {
    if (!this.isValidUUID(blockedId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Verify blocked user exists
    const blockedUser = await this.userRepo.findOne({ where: { id: blockedId } });
    if (!blockedUser) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.blockRepo.findOne({
      where: { blockerId, blockedId },
    });

    if (existing) {
      return existing;
    }

    const block = this.blockRepo.create({
      blockerId,
      blockedId,
    });

    return this.blockRepo.save(block);
  }

  async unblock(blockerId: string, blockedId: string) {
    const block = await this.blockRepo.findOne({
      where: { blockerId, blockedId },
    });

    if (block) {
      await this.blockRepo.remove(block);
    }

    return { success: true };
  }

  async mute(muterId: string, mutedId: string) {
    if (!this.isValidUUID(mutedId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    if (muterId === mutedId) {
      throw new BadRequestException('Cannot mute yourself');
    }

    // Verify muted user exists
    const mutedUser = await this.userRepo.findOne({ where: { id: mutedId } });
    if (!mutedUser) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.muteRepo.findOne({
      where: { muterId, mutedId },
    });

    if (existing) {
      return existing;
    }

    const mute = this.muteRepo.create({
      muterId,
      mutedId,
    });

    return this.muteRepo.save(mute);
  }

  async unmute(muterId: string, mutedId: string) {
    const mute = await this.muteRepo.findOne({
      where: { muterId, mutedId },
    });

    if (mute) {
      await this.muteRepo.remove(mute);
    }

    return { success: true };
  }

  async report(reporterId: string, targetId: string, targetType: string, reason: string) {
    const report = this.reportRepo.create({
      reporterId,
      targetId,
      targetType: targetType as any,
      reason,
      status: 'OPEN' as any,
    });

    const savedReport = await this.reportRepo.save(report);

    // Algorithmic handling of reports
    await this.handleReportThresholds(targetId, targetType);

    return savedReport;
  }

  private async handleReportThresholds(targetId: string, targetType: string) {
    if (targetType !== 'POST' && targetType !== 'REPLY') return;

    const reportCount = await this.reportRepo.count({
      where: { targetId, targetType: targetType as any },
    });

    const AUTO_DELETE_THRESHOLD = 10;
    const AI_CHECK_THRESHOLD = 3;

    if (reportCount >= AUTO_DELETE_THRESHOLD) {
      await this.softDeleteContent(targetId, targetType);
      return;
    }

    if (reportCount >= AI_CHECK_THRESHOLD && this.contentModeration) {
      let content = '';
      let authorId = '';

      if (targetType === 'POST') {
        const post = await this.postRepo.findOne({ where: { id: targetId }, select: ['body', 'authorId'] });
        if (post) {
          content = post.body;
          authorId = post.authorId;
        }
      } else {
        const reply = await this.replyRepo.findOne({ where: { id: targetId }, select: ['body', 'authorId'] });
        if (reply) {
          content = reply.body;
          authorId = reply.authorId;
        }
      }

      if (content) {
        const checkResult = await this.contentModeration.checkContent(
          content,
          authorId,
          targetType === 'POST' ? 'post' : 'reply'
        );

        if (!checkResult.safe) {
          await this.softDeleteContent(targetId, targetType);
        }
      }
    }
  }

  private async softDeleteContent(targetId: string, targetType: string) {
    if (targetType === 'POST') {
      await this.postRepo.softDelete(targetId);
    } else if (targetType === 'REPLY') {
      await this.replyRepo.softDelete(targetId);
    }
  }

  async getBlocked(userId: string) {
    return this.blockRepo.find({
      where: { blockerId: userId },
      relations: ['blocked'],
    });
  }

  async getMuted(userId: string) {
    return this.muteRepo.find({
      where: { muterId: userId },
      relations: ['muted'],
    });
  }

  async isBlocked(userId: string, otherUserId: string): Promise<boolean> {
    const count = await this.blockRepo.count({
      where: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId },
      ],
    });
    return count > 0;
  }

  async isMuted(userId: string, otherUserId: string): Promise<boolean> {
    const count = await this.muteRepo.count({
      where: { muterId: userId, mutedId: otherUserId },
    });
    return count > 0;
  }

  async checkContent(
    text: string,
    userId?: string,
    contentType?: 'post' | 'reply',
  ): Promise<{ safe: boolean; reason?: string; confidence?: number }> {
    // Use ContentModerationService for two-stage moderation
    // This method is kept for backward compatibility
    if (!this.contentModeration) {
      // Fallback if ContentModerationService not injected
      const lower = text.toLowerCase();
      const forbidden = ['spam', 'violence', 'hate'];
      if (forbidden.some(w => lower.includes(w))) {
        return { safe: false, reason: 'Content flagged by safety check.' };
      }
      return { safe: true };
    }

    return this.contentModeration.checkContent(text, userId || '', contentType || 'post');
  }

  async checkImage(buffer: Buffer): Promise<{ safe: boolean; reason?: string; confidence?: number }> {
    // Use ContentModerationService for AI-powered image analysis
    if (this.contentModeration) {
      return this.contentModeration.checkImage(buffer);
    }
    
    // Fallback if ContentModerationService not injected
    if (buffer.length < 100) {
      return { safe: false, reason: 'Image file corrupted or invalid.', confidence: 1.0 };
    }
    return { safe: true, confidence: 0.5 };
  }
}
