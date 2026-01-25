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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keep = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const post_entity_1 = require("./post.entity");
let Keep = class Keep {
    userId;
    postId;
    createdAt;
    user;
    post;
};
exports.Keep = Keep;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'user_id' }),
    __metadata("design:type", String)
], Keep.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'post_id' }),
    __metadata("design:type", String)
], Keep.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Keep.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Keep.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => post_entity_1.Post),
    (0, typeorm_1.JoinColumn)({ name: 'post_id' }),
    __metadata("design:type", post_entity_1.Post)
], Keep.prototype, "post", void 0);
exports.Keep = Keep = __decorate([
    (0, typeorm_1.Entity)('keeps')
], Keep);
//# sourceMappingURL=keep.entity.js.map