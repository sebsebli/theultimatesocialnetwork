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
exports.RepliesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reply_entity_1 = require("../entities/reply.entity");
const post_entity_1 = require("../entities/post.entity");
const mention_entity_1 = require("../entities/mention.entity");
const user_entity_1 = require("../entities/user.entity");
const language_detection_service_1 = require("../shared/language-detection.service");
const neo4j_service_1 = require("../database/neo4j.service");
const notification_helper_service_1 = require("../shared/notification-helper.service");
const safety_service_1 = require("../safety/safety.service");
let RepliesService = class RepliesService {
    replyRepo;
    postRepo;
    mentionRepo;
    userRepo;
    dataSource;
    languageDetection;
    neo4jService;
    notificationHelper;
    safetyService;
    constructor(replyRepo, postRepo, mentionRepo, userRepo, dataSource, languageDetection, neo4jService, notificationHelper, safetyService) {
        this.replyRepo = replyRepo;
        this.postRepo = postRepo;
        this.mentionRepo = mentionRepo;
        this.userRepo = userRepo;
        this.dataSource = dataSource;
        this.languageDetection = languageDetection;
        this.neo4jService = neo4jService;
        this.notificationHelper = notificationHelper;
        this.safetyService = safetyService;
    }
    async create(userId, postId, body, parentReplyId) {
        const safety = await this.safetyService.checkContent(body, userId, 'reply');
        if (!safety.safe) {
            throw new common_1.BadRequestException(safety.reason || 'Reply flagged by safety check');
        }
        const post = await this.postRepo.findOne({ where: { id: postId } });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (parentReplyId) {
            const parentReply = await this.replyRepo.findOne({
                where: { id: parentReplyId },
                relations: ['parentReply'],
            });
            if (parentReply?.parentReplyId) {
                throw new Error('Maximum reply depth exceeded');
            }
        }
        const user = await this.userRepo.findOne({ where: { id: userId }, select: ['languages'] });
        const { lang, confidence } = await this.languageDetection.detectLanguage(body, userId, user?.languages || []);
        const reply = this.replyRepo.create({
            postId,
            authorId: userId,
            body,
            parentReplyId: parentReplyId || undefined,
            lang,
            langConfidence: confidence,
        });
        const savedReply = await this.replyRepo.save(reply);
        await this.postRepo.increment({ id: postId }, 'replyCount', 1);
        if (post.authorId !== userId) {
            await this.notificationHelper.createNotification({
                userId: post.authorId,
                type: 'REPLY',
                actorUserId: userId,
                postId: postId,
                replyId: savedReply.id,
            });
        }
        const mentionRegex = /@(\w+)/g;
        let mentionMatch;
        const mentionedHandles = new Set();
        while ((mentionMatch = mentionRegex.exec(body)) !== null) {
            mentionedHandles.add(mentionMatch[1]);
        }
        for (const handle of mentionedHandles) {
            const mentionedUser = await this.userRepo.findOne({
                where: { handle },
            });
            if (mentionedUser && mentionedUser.id !== userId) {
                await this.mentionRepo.save({
                    replyId: savedReply.id,
                    mentionedUserId: mentionedUser.id,
                });
                await this.notificationHelper.createNotification({
                    userId: mentionedUser.id,
                    type: 'MENTION',
                    actorUserId: userId,
                    postId: postId,
                    replyId: savedReply.id,
                });
            }
        }
        return savedReply;
    }
    async findByPost(postId) {
        return this.replyRepo.find({
            where: { postId },
            relations: ['author', 'parentReply', 'parentReply.author'],
            order: { createdAt: 'ASC' },
        });
    }
    async delete(userId, replyId) {
        const reply = await this.replyRepo.findOne({
            where: { id: replyId, authorId: userId },
        });
        if (!reply) {
            throw new common_1.NotFoundException('Reply not found or unauthorized');
        }
        await this.replyRepo.softDelete(replyId);
        await this.postRepo.decrement({ id: reply.postId }, 'replyCount', 1);
    }
};
exports.RepliesService = RepliesService;
exports.RepliesService = RepliesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reply_entity_1.Reply)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(2, (0, typeorm_1.InjectRepository)(mention_entity_1.Mention)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        language_detection_service_1.LanguageDetectionService,
        neo4j_service_1.Neo4jService,
        notification_helper_service_1.NotificationHelperService,
        safety_service_1.SafetyService])
], RepliesService);
//# sourceMappingURL=replies.service.js.map