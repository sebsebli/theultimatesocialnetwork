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
exports.TopicFollowsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const topic_follow_entity_1 = require("../entities/topic-follow.entity");
const topic_entity_1 = require("../entities/topic.entity");
let TopicFollowsService = class TopicFollowsService {
    topicFollowRepo;
    topicRepo;
    constructor(topicFollowRepo, topicRepo) {
        this.topicFollowRepo = topicFollowRepo;
        this.topicRepo = topicRepo;
    }
    async follow(userId, topicId) {
        const topic = await this.topicRepo.findOne({ where: { id: topicId } });
        if (!topic) {
            throw new Error('Topic not found');
        }
        const existing = await this.topicFollowRepo.findOne({
            where: { userId, topicId },
        });
        if (existing) {
            return existing;
        }
        const follow = this.topicFollowRepo.create({
            userId,
            topicId,
        });
        return this.topicFollowRepo.save(follow);
    }
    async unfollow(userId, topicId) {
        const follow = await this.topicFollowRepo.findOne({
            where: { userId, topicId },
        });
        if (follow) {
            await this.topicFollowRepo.remove(follow);
        }
        return { success: true };
    }
    async isFollowing(userId, topicId) {
        const follow = await this.topicFollowRepo.findOne({
            where: { userId, topicId },
        });
        return !!follow;
    }
};
exports.TopicFollowsService = TopicFollowsService;
exports.TopicFollowsService = TopicFollowsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(topic_follow_entity_1.TopicFollow)),
    __param(1, (0, typeorm_1.InjectRepository)(topic_entity_1.Topic)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TopicFollowsService);
//# sourceMappingURL=topic-follows.service.js.map