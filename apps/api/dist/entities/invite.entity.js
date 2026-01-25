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
exports.Invite = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let Invite = class Invite {
    code;
    creatorId;
    creator;
    usedById;
    usedBy;
    createdAt;
    usedAt;
};
exports.Invite = Invite;
__decorate([
    (0, typeorm_1.PrimaryColumn)('text'),
    __metadata("design:type", String)
], Invite.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'creator_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Invite.prototype, "creatorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'creator_id' }),
    __metadata("design:type", user_entity_1.User)
], Invite.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'used_by_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Invite.prototype, "usedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'used_by_id' }),
    __metadata("design:type", user_entity_1.User)
], Invite.prototype, "usedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Invite.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'used_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Invite.prototype, "usedAt", void 0);
exports.Invite = Invite = __decorate([
    (0, typeorm_1.Entity)('invites')
], Invite);
//# sourceMappingURL=invite.entity.js.map