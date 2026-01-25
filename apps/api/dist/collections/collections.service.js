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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const collection_entity_1 = require("../entities/collection.entity");
const collection_item_entity_1 = require("../entities/collection-item.entity");
const post_entity_1 = require("../entities/post.entity");
const user_entity_1 = require("../entities/user.entity");
let CollectionsService = class CollectionsService {
    collectionRepo;
    itemRepo;
    postRepo;
    userRepo;
    constructor(collectionRepo, itemRepo, postRepo, userRepo) {
        this.collectionRepo = collectionRepo;
        this.itemRepo = itemRepo;
        this.postRepo = postRepo;
        this.userRepo = userRepo;
    }
    async create(userId, title, description, isPublic = false, shareSaves = false) {
        const col = this.collectionRepo.create({
            ownerId: userId,
            title,
            description,
            isPublic,
            shareSaves,
        });
        return this.collectionRepo.save(col);
    }
    async findAll(userId) {
        return this.collectionRepo.find({
            where: { ownerId: userId },
            relations: ['items'],
            order: { createdAt: 'DESC' },
        }).then(collections => collections.map(c => ({
            ...c,
            itemCount: c.items?.length || 0,
        })));
    }
    async findOne(id, userId) {
        const collection = await this.collectionRepo.findOne({
            where: { id, ownerId: userId },
        });
        if (!collection) {
            throw new Error('Collection not found');
        }
        const items = await this.itemRepo.find({
            where: { collectionId: id },
            relations: ['post', 'post.author'],
            order: { addedAt: 'DESC' },
        });
        return { ...collection, items };
    }
    async addItem(collectionId, postId, note) {
        return this.itemRepo.save({ collectionId, postId, curatorNote: note });
    }
    async update(id, userId, dto) {
        const collection = await this.collectionRepo.findOne({
            where: { id, ownerId: userId },
        });
        if (!collection) {
            throw new Error('Collection not found');
        }
        if (dto.shareSaves !== undefined) {
            collection.shareSaves = dto.shareSaves;
        }
        if (dto.title !== undefined) {
            collection.title = dto.title;
        }
        if (dto.description !== undefined) {
            collection.description = dto.description;
        }
        if (dto.isPublic !== undefined) {
            collection.isPublic = dto.isPublic;
        }
        return this.collectionRepo.save(collection);
    }
    async removeItem(collectionId, itemId, userId) {
        const collection = await this.collectionRepo.findOne({
            where: { id: collectionId, ownerId: userId },
        });
        if (!collection) {
            throw new Error('Collection not found');
        }
        await this.itemRepo.delete({ id: itemId, collectionId });
    }
};
exports.CollectionsService = CollectionsService;
exports.CollectionsService = CollectionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(collection_entity_1.Collection)),
    __param(1, (0, typeorm_1.InjectRepository)(collection_item_entity_1.CollectionItem)),
    __param(2, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CollectionsService);
//# sourceMappingURL=collections.service.js.map