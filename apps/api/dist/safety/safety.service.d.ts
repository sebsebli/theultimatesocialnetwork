import { Repository } from 'typeorm';
import { Block } from '../entities/block.entity';
import { Mute } from '../entities/mute.entity';
import { Report } from '../entities/report.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { ContentModerationService } from './content-moderation.service';
export declare class SafetyService {
    private blockRepo;
    private muteRepo;
    private reportRepo;
    private userRepo;
    private postRepo;
    private replyRepo;
    private contentModeration?;
    constructor(blockRepo: Repository<Block>, muteRepo: Repository<Mute>, reportRepo: Repository<Report>, userRepo: Repository<User>, postRepo: Repository<Post>, replyRepo: Repository<Reply>, contentModeration?: ContentModerationService | undefined);
    private isValidUUID;
    block(blockerId: string, blockedId: string): unknown;
    unblock(blockerId: string, blockedId: string): unknown;
    mute(muterId: string, mutedId: string): unknown;
    unmute(muterId: string, mutedId: string): unknown;
    report(reporterId: string, targetId: string, targetType: string, reason: string): unknown;
    private handleReportThresholds;
    private softDeleteContent;
    getBlocked(userId: string): unknown;
    getMuted(userId: string): unknown;
    isBlocked(userId: string, otherUserId: string): Promise<boolean>;
    isMuted(userId: string, otherUserId: string): Promise<boolean>;
    checkContent(text: string, userId?: string, contentType?: 'post' | 'reply'): Promise<{
        safe: boolean;
        reason?: string;
        confidence?: number;
    }>;
    checkImage(buffer: Buffer): Promise<{
        safe: boolean;
        reason?: string;
        confidence?: number;
    }>;
}
