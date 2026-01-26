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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("../entities/notification.entity");
const user_entity_1 = require("../entities/user.entity");
const post_entity_1 = require("../entities/post.entity");
let NotificationsService = class NotificationsService {
    notificationRepo;
    userRepo;
    postRepo;
    constructor(notificationRepo, userRepo, postRepo) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
        this.postRepo = postRepo;
    }
    async findAll(userId) {
        const notifications = await this.notificationRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
        if (notifications.length === 0)
            return [];
        const actorIds = [...new Set(notifications.map(n => n.actorUserId).filter(Boolean))];
        const postIds = [...new Set(notifications.map(n => n.postId).filter(Boolean))];
        const [actors, posts] = await Promise.all([
            actorIds.length > 0 ? this.userRepo.findByIds(actorIds) : [],
            postIds.length > 0 ? this.postRepo.findByIds(postIds) : [],
        ]);
        const actorMap = new Map(actors.map(u => [u.id, u]));
        const postMap = new Map(posts.map(p => [p.id, p]));
        return notifications.map(notif => ({
            ...notif,
            actor: notif.actorUserId ? actorMap.get(notif.actorUserId) : null,
            post: notif.postId ? postMap.get(notif.postId) : null,
        }));
    }
    async markAsRead(userId, notificationId) {
        const notification = await this.notificationRepo.findOne({
            where: { id: notificationId, userId },
        });
        if (notification && !notification.readAt) {
            notification.readAt = new Date();
            await this.notificationRepo.save(notification);
        }
        return notification;
    }
    async markAllAsRead(userId) {
        await this.notificationRepo
            .createQueryBuilder()
            .update(notification_entity_1.Notification)
            .set({ readAt: new Date() })
            .where('user_id = :userId AND read_at IS NULL', { userId })
            .execute();
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map