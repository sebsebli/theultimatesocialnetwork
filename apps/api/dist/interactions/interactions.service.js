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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const like_entity_1 = require("../entities/like.entity");
const keep_entity_1 = require("../entities/keep.entity");
const post_entity_1 = require("../entities/post.entity");
const post_read_entity_1 = require("../entities/post-read.entity");
const notification_helper_service_1 = require("../shared/notification-helper.service");
const ioredis_1 = __importDefault(require("ioredis"));
let InteractionsService = class InteractionsService {
    likeRepo;
    keepRepo;
    postRepo;
    readRepo;
    notificationHelper;
    redis;
    constructor(likeRepo, keepRepo, postRepo, readRepo, notificationHelper, redis) {
        this.likeRepo = likeRepo;
        this.keepRepo = keepRepo;
        this.postRepo = postRepo;
        this.readRepo = readRepo;
        this.notificationHelper = notificationHelper;
        this.redis = redis;
    }
    async recordReadDuration(userId, postId, durationSeconds) {
        if (!userId || durationSeconds <= 0)
            return;
        const existing = await this.readRepo.findOne({ where: { userId, postId } });
        if (existing) {
            existing.durationSeconds += durationSeconds;
            existing.lastReadAt = new Date();
            await this.readRepo.save(existing);
        }
        else {
            await this.readRepo.save({
                userId,
                postId,
                durationSeconds,
            });
        }
    }
    async recordView(postId) {
        const key = `post:views:${postId}`;
        await this.redis.incr(key);
        await this.redis.sadd('post:views:active_set', postId);
    }
    async flushViews() {
        const activePosts = await this.redis.smembers('post:views:active_set');
        if (activePosts.length === 0)
            return;
        for (const postId of activePosts) {
            const key = `post:views:${postId}`;
            const views = await this.redis.get(key);
            if (views && parseInt(views) > 0) {
                await this.postRepo.increment({ id: postId }, 'viewCount', parseInt(views));
                await this.redis.del(key);
            }
        }
        await this.redis.del('post:views:active_set');
    }
    async toggleLike(userId, postId) {
        const post = await this.postRepo.findOne({
            where: { id: postId },
            withDeleted: false,
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const existing = await this.likeRepo.findOne({ where: { userId, postId } });
        if (existing) {
            await this.likeRepo.remove(existing);
            await this.postRepo.decrement({ id: postId }, 'privateLikeCount', 1);
            return { liked: false };
        }
        else {
            await this.likeRepo.save({ userId, postId });
            await this.postRepo.increment({ id: postId }, 'privateLikeCount', 1);
            if (post.authorId !== userId) {
                await this.notificationHelper.createNotification({
                    userId: post.authorId,
                    type: 'LIKE',
                    actorUserId: userId,
                    postId: postId,
                });
            }
            return { liked: true };
        }
    }
    async toggleKeep(userId, postId) {
        const post = await this.postRepo.findOne({
            where: { id: postId },
            withDeleted: false,
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const existing = await this.keepRepo.findOne({ where: { userId, postId } });
        if (existing) {
            await this.keepRepo.remove(existing);
            return { kept: false };
        }
        else {
            await this.keepRepo.save({ userId, postId });
            return { kept: true };
        }
    }
};
exports.InteractionsService = InteractionsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InteractionsService.prototype, "flushViews", null);
exports.InteractionsService = InteractionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(like_entity_1.Like)),
    __param(1, (0, typeorm_1.InjectRepository)(keep_entity_1.Keep)),
    __param(2, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(3, (0, typeorm_1.InjectRepository)(post_read_entity_1.PostRead)),
    __param(5, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notification_helper_service_1.NotificationHelperService,
        ioredis_1.default])
], InteractionsService);
//# sourceMappingURL=interactions.service.js.map