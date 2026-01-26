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
    block(blockerId: string, blockedId: string): Promise<Block>;
    unblock(blockerId: string, blockedId: string): Promise<{
        success: boolean;
    }>;
    mute(muterId: string, mutedId: string): Promise<Mute>;
    unmute(muterId: string, mutedId: string): Promise<{
        success: boolean;
    }>;
    report(reporterId: string, targetId: string, targetType: string, reason: string): Promise<Report>;
    private handleReportThresholds;
    private softDeleteContent;
    getBlocked(userId: string): Promise<Block[]>;
    getMuted(userId: string): Promise<Mute[]>;
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
