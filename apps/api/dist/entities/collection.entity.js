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
exports.Collection = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const collection_item_entity_1 = require("./collection-item.entity");
let Collection = class Collection {
    id;
    ownerId;
    owner;
    items;
    title;
    description;
    isPublic;
    shareSaves;
    createdAt;
    updatedAt;
};
exports.Collection = Collection;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Collection.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Collection.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], Collection.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => collection_item_entity_1.CollectionItem, item => item.collection),
    __metadata("design:type", Array)
], Collection.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Collection.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Collection.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', default: false }),
    __metadata("design:type", Boolean)
], Collection.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'share_saves', default: false }),
    __metadata("design:type", Boolean)
], Collection.prototype, "shareSaves", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Collection.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Collection.prototype, "updatedAt", void 0);
exports.Collection = Collection = __decorate([
    (0, typeorm_1.Entity)('collections')
], Collection);
//# sourceMappingURL=collection.entity.js.map