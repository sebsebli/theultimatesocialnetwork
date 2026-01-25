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
exports.KeepsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const keep_entity_1 = require("../entities/keep.entity");
const post_entity_1 = require("../entities/post.entity");
const collection_item_entity_1 = require("../entities/collection-item.entity");
let KeepsService = class KeepsService {
    keepRepo;
    postRepo;
    collectionItemRepo;
    constructor(keepRepo, postRepo, collectionItemRepo) {
        this.keepRepo = keepRepo;
        this.postRepo = postRepo;
        this.collectionItemRepo = collectionItemRepo;
    }
    async getAll(userId, filters) {
        let query = this.keepRepo
            .createQueryBuilder('keep')
            .leftJoinAndSelect('keep.post', 'post')
            .leftJoinAndSelect('post.author', 'author')
            .where('keep.userId = :userId', { userId })
            .orderBy('keep.createdAt', 'DESC');
        if (filters?.search) {
            query = query.andWhere('(post.body ILIKE :search OR post.title ILIKE :search)', { search: `%${filters.search}%` });
        }
        if (filters?.inCollection !== undefined) {
            if (filters.inCollection) {
                query = query
                    .leftJoin('collection_items', 'item', 'item.post_id = post.id')
                    .andWhere('item.id IS NOT NULL');
            }
            else {
                query = query
                    .leftJoin('collection_items', 'item', 'item.post_id = post.id')
                    .andWhere('item.id IS NULL');
            }
        }
        return query.getMany();
    }
};
exports.KeepsService = KeepsService;
exports.KeepsService = KeepsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(keep_entity_1.Keep)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(2, (0, typeorm_1.InjectRepository)(collection_item_entity_1.CollectionItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], KeepsService);
//# sourceMappingURL=keeps.service.js.map