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
exports.User = void 0;
const typeorm_1 = require("typeorm");
let User = class User {
    id;
    email;
    handle;
    displayName;
    bio;
    isProtected;
    invitesRemaining;
    languages;
    createdAt;
    updatedAt;
    deletedAt;
    followerCount;
    followingCount;
    quoteReceivedCount;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "handle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_name' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "displayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_protected', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isProtected", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invites_remaining', default: 3 }),
    __metadata("design:type", Number)
], User.prototype, "invitesRemaining", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, default: '{}' }),
    __metadata("design:type", Array)
], User.prototype, "languages", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], User.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], User.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'following_count', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "followingCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quote_received_count', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "quoteReceivedCount", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map