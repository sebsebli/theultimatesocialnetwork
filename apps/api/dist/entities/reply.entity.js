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
exports.Reply = void 0;
const typeorm_1 = require("typeorm");
let Reply = class Reply {
    id;
    postId;
    authorId;
    parentReplyId;
    body;
    lang;
    langConfidence;
    createdAt;
    deletedAt;
};
exports.Reply = Reply;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Reply.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id', type: 'uuid' }),
    __metadata("design:type", String)
], Reply.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_id', type: 'uuid' }),
    __metadata("design:type", String)
], Reply.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_reply_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Reply.prototype, "parentReplyId", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Reply.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Reply.prototype, "lang", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lang_confidence', type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Reply.prototype, "langConfidence", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Reply.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], Reply.prototype, "deletedAt", void 0);
exports.Reply = Reply = __decorate([
    (0, typeorm_1.Entity)('replies')
], Reply);
//# sourceMappingURL=reply.entity.js.map