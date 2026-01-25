"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const block_entity_1 = require("../entities/block.entity");
const mute_entity_1 = require("../entities/mute.entity");
const report_entity_1 = require("../entities/report.entity");
const user_entity_1 = require("../entities/user.entity");
const post_entity_1 = require("../entities/post.entity");
const reply_entity_1 = require("../entities/reply.entity");
const content_moderation_service_1 = require("./content-moderation.service");
let SafetyService = class SafetyService {
    blockRepo;
    muteRepo;
    reportRepo;
    userRepo;
    postRepo;
    replyRepo;
    contentModeration;
    constructor(blockRepo, muteRepo, reportRepo, userRepo, postRepo, replyRepo, contentModeration) {
        this.blockRepo = blockRepo;
        this.muteRepo = muteRepo;
        this.reportRepo = reportRepo;
        this.userRepo = userRepo;
        this.postRepo = postRepo;
        this.replyRepo = replyRepo;
        this.contentModeration = contentModeration;
    }
    isValidUUID(uuid) {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return regex.test(uuid);
    }
    async block(blockerId, blockedId) {
        if (!this.isValidUUID(blockedId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        if (blockerId === blockedId) {
            throw new common_1.BadRequestException('Cannot block yourself');
        }
        const blockedUser = await this.userRepo.findOne({ where: { id: blockedId } });
        if (!blockedUser) {
            throw new common_1.NotFoundException('User not found');
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
    async unblock(blockerId, blockedId) {
        const block = await this.blockRepo.findOne({
            where: { blockerId, blockedId },
        });
        if (block) {
            await this.blockRepo.remove(block);
        }
        return { success: true };
    }
    async mute(muterId, mutedId) {
        if (!this.isValidUUID(mutedId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        if (muterId === mutedId) {
            throw new common_1.BadRequestException('Cannot mute yourself');
        }
        const mutedUser = await this.userRepo.findOne({ where: { id: mutedId } });
        if (!mutedUser) {
            throw new common_1.NotFoundException('User not found');
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
    async unmute(muterId, mutedId) {
        const mute = await this.muteRepo.findOne({
            where: { muterId, mutedId },
        });
        if (mute) {
            await this.muteRepo.remove(mute);
        }
        return { success: true };
    }
    async report(reporterId, targetId, targetType, reason) {
        const report = this.reportRepo.create({
            reporterId,
            targetId,
            targetType: targetType,
            reason,
            status: 'OPEN',
        });
        const savedReport = await this.reportRepo.save(report);
        await this.handleReportThresholds(targetId, targetType);
        return savedReport;
    }
    async handleReportThresholds(targetId, targetType) {
        if (targetType !== 'POST' && targetType !== 'REPLY') {
            return;
        }
        const reportCount = await this.reportRepo.count({
            where: { targetId, targetType: targetType },
        });
        const AI_CHECK_THRESHOLD = 3;
        const AUTO_DELETE_THRESHOLD = 10;
        let content = '';
        let authorId = '';
        let entity = null;
        if (targetType === 'POST') {
            entity = await this.postRepo.findOne({ where: { id: targetId } });
            if (entity) {
                content = entity.body;
                authorId = entity.authorId;
            }
        }
        else if (targetType === 'REPLY') {
            entity = await this.replyRepo.findOne({ where: { id: targetId } });
            if (entity) {
                content = entity.body;
                authorId = entity.authorId;
            }
        }
        if (!entity || !content) {
            return;
        }
        if (reportCount >= AUTO_DELETE_THRESHOLD) {
            await this.softDeleteContent(targetId, targetType);
            return;
        }
        if (reportCount >= AI_CHECK_THRESHOLD && this.contentModeration) {
            const checkResult = await this.contentModeration.checkContent(content, authorId, targetType === 'POST' ? 'post' : 'reply');
            if (!checkResult.safe) {
                await this.softDeleteContent(targetId, targetType);
            }
        }
    }
    async softDeleteContent(targetId, targetType) {
        if (targetType === 'POST') {
            await this.postRepo.softDelete(targetId);
        }
        else if (targetType === 'REPLY') {
            await this.replyRepo.softDelete(targetId);
        }
    }
    async getBlocked(userId) {
        return this.blockRepo.find({
            where: { blockerId: userId },
            relations: ['blocked'],
        });
    }
    async getMuted(userId) {
        return this.muteRepo.find({
            where: { muterId: userId },
            relations: ['muted'],
        });
    }
    async isBlocked(userId, otherUserId) {
        const block = await this.blockRepo.findOne({
            where: [
                { blockerId: userId, blockedId: otherUserId },
                { blockerId: otherUserId, blockedId: userId },
            ],
        });
        return !!block;
    }
    async isMuted(userId, otherUserId) {
        const mute = await this.muteRepo.findOne({
            where: { muterId: userId, mutedId: otherUserId },
        });
        return !!mute;
    }
    async checkContent(text, userId, contentType) {
        if (!this.contentModeration) {
            const lower = text.toLowerCase();
            const forbidden = ['spam', 'violence', 'hate'];
            if (forbidden.some(w => lower.includes(w))) {
                return { safe: false, reason: 'Content flagged by safety check.' };
            }
            return { safe: true };
        }
        return this.contentModeration.checkContent(text, userId || '', contentType || 'post');
    }
    async checkImage(buffer) {
        if (this.contentModeration) {
            return this.contentModeration.checkImage(buffer);
        }
        if (buffer.length < 100) {
            return { safe: false, reason: 'Image file corrupted or invalid.', confidence: 1.0 };
        }
        return { safe: true, confidence: 0.5 };
    }
};
exports.SafetyService = SafetyService;
exports.SafetyService = SafetyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(block_entity_1.Block)),
    __param(1, (0, typeorm_1.InjectRepository)(mute_entity_1.Mute)),
    __param(2, (0, typeorm_1.InjectRepository)(report_entity_1.Report)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(5, (0, typeorm_1.InjectRepository)(reply_entity_1.Reply)),
    __param(6, (0, common_1.Optional)()),
    __param(6, (0, common_1.Inject)(content_moderation_service_1.ContentModerationService)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        content_moderation_service_1.ContentModerationService])
], SafetyService);
//# sourceMappingURL=safety.service.js.map