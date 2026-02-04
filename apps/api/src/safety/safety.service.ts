import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from '../entities/block.entity';
import { Mute } from '../entities/mute.entity';
import {
  Report,
  ReportStatus,
  ReportTargetType,
} from '../entities/report.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import {
  ModerationRecord,
  ModerationReasonCode,
  ModerationSource,
  ModerationTargetType,
} from '../entities/moderation-record.entity';

import { ContentModerationService } from './content-moderation.service';
import { TrustService } from './trust.service';

/**
 * Safety and content moderation. Content moderation is applied to:
 * - Posts: async in post.worker (checkContent → soft-delete + recordModeration on failure).
 * - Replies (comments): async in reply.worker (checkContent → soft-delete + recordModeration on failure).
 * - Images: sync in upload.service processAndUpload (checkImage before storing; all uploads use this).
 */
@Injectable()
export class SafetyService {
  constructor(
    @InjectRepository(Block) private blockRepo: Repository<Block>,
    @InjectRepository(Mute) private muteRepo: Repository<Mute>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
    @InjectRepository(ModerationRecord)
    private moderationRecordRepo: Repository<ModerationRecord>,
    @Optional()
    @Inject(ContentModerationService)
    private contentModeration?: ContentModerationService,
    @Inject(TrustService) private trustService?: TrustService,
  ) {}

  /**
   * List moderation records (admin). Filter by authorId, reasonCode, source; paginate.
   */
  async getModerationRecords(filters: {
    authorId?: string;
    reasonCode?: ModerationReasonCode;
    source?: ModerationSource;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(filters.limit ?? 50, 100);
    const offset = filters.offset ?? 0;
    const qb = this.moderationRecordRepo
      .createQueryBuilder('r')
      .orderBy('r.createdAt', 'DESC')
      .take(limit)
      .skip(offset);
    if (filters.authorId)
      qb.andWhere('r.authorId = :authorId', { authorId: filters.authorId });
    if (filters.reasonCode)
      qb.andWhere('r.reasonCode = :reasonCode', {
        reasonCode: filters.reasonCode,
      });
    if (filters.source)
      qb.andWhere('r.source = :source', { source: filters.source });
    const [items, total] = await qb.getManyAndCount();
    return { items, total, limit, offset };
  }

  /**
   * Moderation stats for an author (admin). Used for permanent-ban escalation.
   * suggestPermanentBan is true when total violations exceed a threshold (e.g. 5).
   */
  async getModerationStatsByAuthor(authorId: string): Promise<{
    total: number;
    byReasonCode: Record<string, number>;
    suggestPermanentBan: boolean;
  }> {
    const records = await this.moderationRecordRepo.find({
      where: { authorId },
      select: ['reasonCode'],
    });
    const total = records.length;
    const byReasonCode: Record<string, number> = {};
    for (const r of records) {
      byReasonCode[r.reasonCode] = (byReasonCode[r.reasonCode] ?? 0) + 1;
    }
    const PERMANENT_BAN_SUGGEST_THRESHOLD = 5;
    const suggestPermanentBan = total >= PERMANENT_BAN_SUGGEST_THRESHOLD;
    return { total, byReasonCode, suggestPermanentBan };
  }

  /**
   * Persist a moderation decision (blocked content) for review and analytics.
   * Stores content snapshot, reason code, and confidence.
   */
  async recordModeration(params: {
    targetType: ModerationTargetType;
    targetId: string;
    authorId: string;
    reasonCode: ModerationReasonCode;
    reasonText: string;
    confidence: number;
    contentSnapshot: string;
    source: ModerationSource;
  }): Promise<ModerationRecord> {
    const record = this.moderationRecordRepo.create({
      targetType: params.targetType,
      targetId: params.targetId,
      authorId: params.authorId,
      reasonCode: params.reasonCode,
      reasonText: params.reasonText,
      confidence: params.confidence,
      contentSnapshot: params.contentSnapshot.substring(0, 10000), // cap length
      source: params.source,
    });
    return this.moderationRecordRepo.save(record);
  }

  private isValidUUID(uuid: string): boolean {
    const regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
    const blockedUser = await this.userRepo.findOne({
      where: { id: blockedId },
    });
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

  async report(
    reporterId: string,
    targetId: string,
    targetType: string,
    reason: string,
    comment?: string,
  ) {
    const report = this.reportRepo.create({
      reporterId,
      targetId,
      targetType: targetType as ReportTargetType,
      reason,
      comment: comment?.trim() || null,
      status: ReportStatus.OPEN,
    });

    const savedReport = await this.reportRepo.save(report);

    // Algorithmic handling of reports
    await this.handleReportThresholds(targetId, targetType);

    return savedReport;
  }

  private async handleReportThresholds(targetId: string, targetType: string) {
    if (targetType !== 'POST' && targetType !== 'REPLY') return;

    const reportCount = await this.reportRepo.count({
      where: { targetId, targetType: targetType as ReportTargetType },
    });

    const AUTO_DELETE_THRESHOLD = 10;
    const AI_CHECK_THRESHOLD = 3;

    if (reportCount >= AUTO_DELETE_THRESHOLD) {
      let content = '';
      let authorId = '';
      if (targetType === 'POST') {
        const post = await this.postRepo.findOne({
          where: { id: targetId },
          select: ['body', 'authorId'],
        });
        if (post) {
          content = post.body;
          authorId = post.authorId || '';
        }
      } else {
        const reply = await this.replyRepo.findOne({
          where: { id: targetId },
          select: ['body', 'authorId'],
        });
        if (reply) {
          content = reply.body;
          authorId = reply.authorId;
        }
      }
      if (content && authorId) {
        await this.recordModeration({
          targetType:
            targetType === 'POST'
              ? ModerationTargetType.POST
              : ModerationTargetType.REPLY,
          targetId,
          authorId,
          reasonCode: ModerationReasonCode.OTHER,
          reasonText: `Report threshold exceeded (${reportCount} reports)`,
          confidence: 1,
          contentSnapshot: content,
          source: ModerationSource.REPORT_THRESHOLD,
        }).catch(() => {});
      }
      await this.softDeleteContent(targetId, targetType);
      return;
    }

    if (reportCount >= AI_CHECK_THRESHOLD && this.contentModeration) {
      let content = '';
      let authorId = '';

      if (targetType === 'POST') {
        const post = await this.postRepo.findOne({
          where: { id: targetId },
          select: ['body', 'authorId'],
        });
        if (post) {
          content = post.body;
          authorId = post.authorId || '';
        }
      } else {
        const reply = await this.replyRepo.findOne({
          where: { id: targetId },
          select: ['body', 'authorId'],
        });
        if (reply) {
          content = reply.body;
          authorId = reply.authorId;
        }
      }

      if (content) {
        const checkResult = await this.contentModeration.checkContent(
          content,
          authorId,
          targetType === 'POST' ? 'post' : 'reply',
        );

        if (!checkResult.safe) {
          await this.recordModeration({
            targetType:
              targetType === 'POST'
                ? ModerationTargetType.POST
                : ModerationTargetType.REPLY,
            targetId,
            authorId,
            reasonCode: checkResult.reasonCode ?? ModerationReasonCode.OTHER,
            reasonText: checkResult.reason ?? 'Content moderated',
            confidence: checkResult.confidence ?? 0.5,
            contentSnapshot: content,
            source: ModerationSource.REPORT_THRESHOLD,
          }).catch(() => {
            // non-fatal: still soft-delete
          });
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

  async getBlocked(
    userId: string,
  ): Promise<Array<{ id: string; displayName: string; handle: string }>> {
    const blocks = await this.blockRepo.find({
      where: { blockerId: userId },
      relations: ['blocked'],
    });
    return blocks
      .filter((b) => b.blocked != null)
      .map((b) => ({
        id: b.blockedId,
        displayName: (b.blocked as { displayName?: string }).displayName ?? '',
        handle: (b.blocked as { handle?: string }).handle ?? '',
      }));
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
    options: { onlyFast?: boolean } = {}, // Support async moderation options
  ): Promise<{
    safe: boolean;
    reason?: string;
    confidence?: number;
    needsStage2?: boolean;
    reasonCode?: ModerationReasonCode;
  }> {
    // Trusted user check: if trusted, force "onlyFast" unless explicit override
    if (userId && this.trustService && !options.onlyFast) {
      const isTrusted = await this.trustService.isTrusted(userId);
      if (isTrusted) {
        options = { ...options, onlyFast: true };
      }
    }

    // Use ContentModerationService for two-stage moderation
    if (!this.contentModeration) {
      // Fallback if ContentModerationService not injected
      const lower = text.toLowerCase();
      const forbidden = ['spam', 'violence', 'hate'];
      if (forbidden.some((w) => lower.includes(w))) {
        return { safe: false, reason: 'Content flagged by safety check.' };
      }
      return { safe: true };
    }

    return this.contentModeration.checkContent(
      text,
      userId || '',
      contentType || 'post',
      options,
    );
  }

  async checkImage(
    buffer: Buffer,
  ): Promise<{ safe: boolean; reason?: string; confidence?: number }> {
    // Use ContentModerationService for AI-powered image analysis
    if (this.contentModeration) {
      return this.contentModeration.checkImage(buffer);
    }

    // No moderation service: reject (never allow unmoderated images)
    if (buffer.length < 100) {
      return {
        safe: false,
        reason: 'Image file corrupted or invalid.',
        confidence: 1.0,
      };
    }
    return {
      safe: false,
      reason: 'Image moderation not available.',
      confidence: 0,
    };
  }
}
