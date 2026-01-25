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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = exports.PostVisibility = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var PostVisibility;
(function (PostVisibility) {
    PostVisibility["FOLLOWERS"] = "FOLLOWERS";
    PostVisibility["PUBLIC"] = "PUBLIC";
})(PostVisibility || (exports.PostVisibility = PostVisibility = {}));
let Post = class Post {
    id;
    authorId;
    author;
    visibility;
    body;
    title;
    headerImageKey;
    headerImageBlurhash;
    lang;
    langConfidence;
    createdAt;
    updatedAt;
    deletedAt;
    replyCount;
    quoteCount;
    privateLikeCount;
    viewCount;
    readingTimeMinutes;
};
exports.Post = Post;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Post.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Post.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'author_id' }),
    __metadata("design:type", user_entity_1.User)
], Post.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PostVisibility,
        default: PostVisibility.PUBLIC,
    }),
    __metadata("design:type", String)
], Post.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Post.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Post.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'header_image_key', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Post.prototype, "headerImageKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'header_image_blurhash', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Post.prototype, "headerImageBlurhash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], Post.prototype, "lang", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lang_confidence', type: 'float', nullable: true }),
    __metadata("design:type", Object)
], Post.prototype, "langConfidence", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Post.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Post.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Post.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reply_count', default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "replyCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quote_count', default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "quoteCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'private_like_count', default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "privateLikeCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'view_count', default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reading_time_minutes', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "readingTimeMinutes", void 0);
exports.Post = Post = __decorate([
    (0, typeorm_1.Entity)('posts')
], Post);
//# sourceMappingURL=post.entity.js.map