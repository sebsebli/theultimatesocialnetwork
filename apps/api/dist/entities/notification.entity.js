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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = exports.NotificationType = void 0;
const typeorm_1 = require("typeorm");
var NotificationType;
(function (NotificationType) {
    NotificationType["FOLLOW"] = "FOLLOW";
    NotificationType["FOLLOW_REQUEST"] = "FOLLOW_REQUEST";
    NotificationType["REPLY"] = "REPLY";
    NotificationType["QUOTE"] = "QUOTE";
    NotificationType["LIKE"] = "LIKE";
    NotificationType["MENTION"] = "MENTION";
    NotificationType["COLLECTION_ADD"] = "COLLECTION_ADD";
    NotificationType["DM"] = "DM";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
let Notification = class Notification {
    id;
    userId;
    type;
    actorUserId;
    postId;
    replyId;
    collectionId;
    createdAt;
    readAt;
};
exports.Notification = Notification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Notification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], Notification.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['FOLLOW', 'FOLLOW_REQUEST', 'REPLY', 'QUOTE', 'LIKE', 'MENTION', 'COLLECTION_ADD', 'DM'],
    }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "actorUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reply_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "replyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'collection_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "collectionId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Notification.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'read_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "readAt", void 0);
exports.Notification = Notification = __decorate([
    (0, typeorm_1.Entity)('notifications')
], Notification);
//# sourceMappingURL=notification.entity.js.map