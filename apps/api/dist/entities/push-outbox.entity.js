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
exports.PushOutbox = exports.PushStatus = void 0;
const typeorm_1 = require("typeorm");
var PushStatus;
(function (PushStatus) {
    PushStatus["PENDING"] = "pending";
    PushStatus["SENT"] = "sent";
    PushStatus["FAILED"] = "failed";
    PushStatus["SUPPRESSED"] = "suppressed";
})(PushStatus || (exports.PushStatus = PushStatus = {}));
let PushOutbox = class PushOutbox {
    id;
    userId;
    notifType;
    title;
    body;
    data;
    priority;
    status;
    attemptCount;
    lastError;
    createdAt;
    sentAt;
};
exports.PushOutbox = PushOutbox;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PushOutbox.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], PushOutbox.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notif_type' }),
    __metadata("design:type", String)
], PushOutbox.prototype, "notifType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PushOutbox.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PushOutbox.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], PushOutbox.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'normal' }),
    __metadata("design:type", String)
], PushOutbox.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PushStatus,
        default: PushStatus.PENDING,
    }),
    __metadata("design:type", String)
], PushOutbox.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'attempt_count', default: 0 }),
    __metadata("design:type", Number)
], PushOutbox.prototype, "attemptCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_error', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PushOutbox.prototype, "lastError", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PushOutbox.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], PushOutbox.prototype, "sentAt", void 0);
exports.PushOutbox = PushOutbox = __decorate([
    (0, typeorm_1.Entity)('push_outbox')
], PushOutbox);
//# sourceMappingURL=push-outbox.entity.js.map