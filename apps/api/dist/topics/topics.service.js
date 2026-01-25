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
exports.TopicsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const topic_entity_1 = require("../entities/topic.entity");
const post_entity_1 = require("../entities/post.entity");
const post_topic_entity_1 = require("../entities/post-topic.entity");
const explore_service_1 = require("../explore/explore.service");
let TopicsService = class TopicsService {
    topicRepo;
    postRepo;
    postTopicRepo;
    exploreService;
    constructor(topicRepo, postRepo, postTopicRepo, exploreService) {
        this.topicRepo = topicRepo;
        this.postRepo = postRepo;
        this.postTopicRepo = postTopicRepo;
        this.exploreService = exploreService;
    }
    async findOne(slug) {
        const topic = await this.topicRepo.findOne({
            where: { slug },
        });
        if (!topic) {
            return null;
        }
        const postTopics = await this.postTopicRepo.find({
            where: { topicId: topic.id },
            relations: ['post', 'post.author'],
        });
        const posts = postTopics
            .map(pt => pt.post)
            .filter(post => post && !post.deletedAt)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 50);
        const startHere = await this.exploreService.getTopicStartHere(topic.id, 10);
        return {
            ...topic,
            posts,
            startHere,
        };
    }
    async getPosts(topicId) {
        const postTopics = await this.postTopicRepo.find({
            where: { topicId },
            relations: ['post', 'post.author'],
        });
        return postTopics
            .map(pt => pt.post)
            .filter(post => post && !post.deletedAt)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 50);
    }
};
exports.TopicsService = TopicsService;
exports.TopicsService = TopicsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(topic_entity_1.Topic)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(2, (0, typeorm_1.InjectRepository)(post_topic_entity_1.PostTopic)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        explore_service_1.ExploreService])
], TopicsService);
//# sourceMappingURL=topics.service.js.map