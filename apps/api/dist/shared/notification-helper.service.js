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
exports.NotificationHelperService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("../entities/notification.entity");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let NotificationHelperService = class NotificationHelperService {
    notificationRepo;
    realtimeGateway;
    constructor(notificationRepo, realtimeGateway) {
        this.notificationRepo = notificationRepo;
        this.realtimeGateway = realtimeGateway;
    }
    async createNotification(data) {
        if (data.actorUserId === data.userId) {
            return;
        }
        const existing = await this.notificationRepo.findOne({
            where: {
                userId: data.userId,
                type: data.type,
                actorUserId: data.actorUserId,
                postId: data.postId || undefined,
                replyId: data.replyId || undefined,
                collectionId: data.collectionId || undefined,
            },
        });
        if (existing) {
            return existing;
        }
        const notification = this.notificationRepo.create(data);
        const saved = await this.notificationRepo.save(notification);
        this.realtimeGateway.sendNotification(data.userId, saved);
        return saved;
    }
};
exports.NotificationHelperService = NotificationHelperService;
exports.NotificationHelperService = NotificationHelperService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        realtime_gateway_1.RealtimeGateway])
], NotificationHelperService);
//# sourceMappingURL=notification-helper.service.js.map