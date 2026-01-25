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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const dm_thread_entity_1 = require("../entities/dm-thread.entity");
const dm_message_entity_1 = require("../entities/dm-message.entity");
const user_entity_1 = require("../entities/user.entity");
const follow_entity_1 = require("../entities/follow.entity");
const notification_helper_service_1 = require("../shared/notification-helper.service");
let MessagesService = class MessagesService {
    threadRepo;
    messageRepo;
    userRepo;
    followRepo;
    notificationHelper;
    constructor(threadRepo, messageRepo, userRepo, followRepo, notificationHelper) {
        this.threadRepo = threadRepo;
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.followRepo = followRepo;
        this.notificationHelper = notificationHelper;
    }
    async findOrCreateThread(userId, otherUserId) {
        if (userId === otherUserId) {
            throw new Error('Cannot message yourself');
        }
        const isMutualFollow = await this.followRepo.findOne({
            where: [
                { followerId: userId, followeeId: otherUserId },
                { followerId: otherUserId, followeeId: userId },
            ],
        });
        if (!isMutualFollow) {
            const existingThread = await this.threadRepo.findOne({
                where: [
                    { userA: userId, userB: otherUserId },
                    { userA: otherUserId, userB: userId },
                ],
            });
            if (!existingThread) {
                throw new common_1.ForbiddenException('Must follow each other or have prior interaction');
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
    async sendMessage(userId, threadId, body) {
        const thread = await this.threadRepo.findOne({
            where: { id: threadId },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        if (thread.userA !== userId && thread.userB !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        const message = this.messageRepo.create({
            threadId,
            senderId: userId,
            body,
        });
        const savedMessage = await this.messageRepo.save(message);
        const recipientId = thread.userA === userId ? thread.userB : thread.userA;
        await this.notificationHelper.createNotification({
            userId: recipientId,
            type: 'DM',
            actorUserId: userId,
        });
        return savedMessage;
    }
    async getThreads(userId) {
        const threads = await this.threadRepo.find({
            where: [{ userA: userId }, { userB: userId }],
            order: { createdAt: 'DESC' },
        });
        return Promise.all(threads.map(async (thread) => {
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
        }));
    }
    async getMessages(userId, threadId) {
        const thread = await this.threadRepo.findOne({
            where: { id: threadId },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        if (thread.userA !== userId && thread.userB !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        return this.messageRepo.find({
            where: { threadId },
            relations: ['thread'],
            order: { createdAt: 'ASC' },
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(dm_thread_entity_1.DmThread)),
    __param(1, (0, typeorm_1.InjectRepository)(dm_message_entity_1.DmMessage)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(follow_entity_1.Follow)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object, typeof (_d = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _d : Object, notification_helper_service_1.NotificationHelperService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map