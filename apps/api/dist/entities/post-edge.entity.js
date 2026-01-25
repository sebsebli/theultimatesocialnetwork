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
exports.PostEdge = exports.EdgeType = void 0;
const typeorm_1 = require("typeorm");
const post_entity_1 = require("./post.entity");
var EdgeType;
(function (EdgeType) {
    EdgeType["LINK"] = "LINK";
    EdgeType["QUOTE"] = "QUOTE";
})(EdgeType || (exports.EdgeType = EdgeType = {}));
let PostEdge = class PostEdge {
    id;
    fromPostId;
    toPostId;
    fromPost;
    toPost;
    edgeType;
    anchorText;
    createdAt;
};
exports.PostEdge = PostEdge;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PostEdge.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_post_id', type: 'uuid' }),
    __metadata("design:type", String)
], PostEdge.prototype, "fromPostId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'to_post_id', type: 'uuid' }),
    __metadata("design:type", String)
], PostEdge.prototype, "toPostId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => post_entity_1.Post),
    (0, typeorm_1.JoinColumn)({ name: 'from_post_id' }),
    __metadata("design:type", post_entity_1.Post)
], PostEdge.prototype, "fromPost", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => post_entity_1.Post),
    (0, typeorm_1.JoinColumn)({ name: 'to_post_id' }),
    __metadata("design:type", post_entity_1.Post)
], PostEdge.prototype, "toPost", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EdgeType,
        name: 'edge_type',
    }),
    __metadata("design:type", String)
], PostEdge.prototype, "edgeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'anchor_text', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PostEdge.prototype, "anchorText", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], PostEdge.prototype, "createdAt", void 0);
exports.PostEdge = PostEdge = __decorate([
    (0, typeorm_1.Entity)('post_edges')
], PostEdge);
//# sourceMappingURL=post-edge.entity.js.map