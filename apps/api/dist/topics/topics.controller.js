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
exports.TopicsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const topics_service_1 = require("./topics.service");
const topic_follows_service_1 = require("./topic-follows.service");
const current_user_decorator_1 = require("../shared/current-user.decorator");
let TopicsController = class TopicsController {
    topicsService;
    topicFollowsService;
    constructor(topicsService, topicFollowsService) {
        this.topicsService = topicsService;
        this.topicFollowsService = topicFollowsService;
    }
    async findOne(slug, user) {
        const topic = await this.topicsService.findOne(slug);
        if (!topic) {
            throw new Error('Topic not found');
        }
        const posts = await this.topicsService.getPosts(topic.id);
        let isFollowing = false;
        if (user) {
            isFollowing = await this.topicFollowsService.isFollowing(user.id, topic.id);
        }
        return { ...topic, posts, isFollowing };
    }
    async follow(user, slug) {
        const topic = await this.topicsService.findOne(slug);
        if (!topic) {
            throw new Error('Topic not found');
        }
        return this.topicFollowsService.follow(user.id, topic.id);
    }
    async unfollow(user, slug) {
        const topic = await this.topicsService.findOne(slug);
        if (!topic) {
            throw new Error('Topic not found');
        }
        return this.topicFollowsService.unfollow(user.id, topic.id);
    }
};
exports.TopicsController = TopicsController;
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':slug/follow'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "follow", null);
__decorate([
    (0, common_1.Delete)(':slug/follow'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "unfollow", null);
exports.TopicsController = TopicsController = __decorate([
    (0, common_1.Controller)('topics'),
    __metadata("design:paramtypes", [topics_service_1.TopicsService,
        topic_follows_service_1.TopicFollowsService])
], TopicsController);
//# sourceMappingURL=topics.controller.js.map