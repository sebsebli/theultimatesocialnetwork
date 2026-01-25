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
exports.ExternalSource = void 0;
const typeorm_1 = require("typeorm");
const post_entity_1 = require("./post.entity");
let ExternalSource = class ExternalSource {
    id;
    postId;
    post;
    url;
    canonicalUrl;
    title;
    createdAt;
};
exports.ExternalSource = ExternalSource;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExternalSource.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id' }),
    __metadata("design:type", String)
], ExternalSource.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => post_entity_1.Post),
    (0, typeorm_1.JoinColumn)({ name: 'post_id' }),
    __metadata("design:type", post_entity_1.Post)
], ExternalSource.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ExternalSource.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'canonical_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ExternalSource.prototype, "canonicalUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ExternalSource.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], ExternalSource.prototype, "createdAt", void 0);
exports.ExternalSource = ExternalSource = __decorate([
    (0, typeorm_1.Entity)('external_sources')
], ExternalSource);
//# sourceMappingURL=external-source.entity.js.map