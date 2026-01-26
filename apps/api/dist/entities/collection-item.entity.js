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
exports.CollectionItem = void 0;
const typeorm_1 = require("typeorm");
const collection_entity_1 = require("./collection.entity");
const post_entity_1 = require("./post.entity");
let CollectionItem = class CollectionItem {
    id;
    collectionId;
    collection;
    postId;
    post;
    curatorNote;
    addedAt;
    sortOrder;
};
exports.CollectionItem = CollectionItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CollectionItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'collection_id' }),
    __metadata("design:type", String)
], CollectionItem.prototype, "collectionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => collection_entity_1.Collection),
    (0, typeorm_1.JoinColumn)({ name: 'collection_id' }),
    __metadata("design:type", collection_entity_1.Collection)
], CollectionItem.prototype, "collection", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id' }),
    __metadata("design:type", String)
], CollectionItem.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => post_entity_1.Post),
    (0, typeorm_1.JoinColumn)({ name: 'post_id' }),
    __metadata("design:type", post_entity_1.Post)
], CollectionItem.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'curator_note', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CollectionItem.prototype, "curatorNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'added_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], CollectionItem.prototype, "addedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', default: 0 }),
    __metadata("design:type", Number)
], CollectionItem.prototype, "sortOrder", void 0);
exports.CollectionItem = CollectionItem = __decorate([
    (0, typeorm_1.Entity)('collection_items')
], CollectionItem);
//# sourceMappingURL=collection-item.entity.js.map