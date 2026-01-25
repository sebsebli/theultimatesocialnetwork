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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DmMessage = void 0;
const typeorm_1 = require("typeorm");
const dm_thread_entity_1 = require("./dm-thread.entity");
let DmMessage = class DmMessage {
    id;
    threadId;
    thread;
    senderId;
    body;
    createdAt;
    deletedAt;
};
exports.DmMessage = DmMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DmMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thread_id' }),
    __metadata("design:type", String)
], DmMessage.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dm_thread_entity_1.DmThread),
    (0, typeorm_1.JoinColumn)({ name: 'thread_id' }),
    __metadata("design:type", dm_thread_entity_1.DmThread)
], DmMessage.prototype, "thread", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender_id' }),
    __metadata("design:type", String)
], DmMessage.prototype, "senderId", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], DmMessage.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DmMessage.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], DmMessage.prototype, "deletedAt", void 0);
exports.DmMessage = DmMessage = __decorate([
    (0, typeorm_1.Entity)('dm_messages')
], DmMessage);
//# sourceMappingURL=dm-message.entity.js.map