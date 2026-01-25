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
exports.ExploreController = void 0;
const common_1 = require("@nestjs/common");
const explore_service_1 = require("./explore.service");
const recommendation_service_1 = require("./recommendation.service");
const passport_1 = require("@nestjs/passport");
const current_user_decorator_1 = require("../shared/current-user.decorator");
let ExploreController = class ExploreController {
    exploreService;
    recommendationService;
    constructor(exploreService, recommendationService) {
        this.exploreService = exploreService;
        this.recommendationService = recommendationService;
    }
    async getTopics(lang, sort) {
        return this.exploreService.getTopics({ lang, sort });
    }
    async getPeople(user, lang, sort) {
        if (user?.id) {
            return this.recommendationService.getRecommendedPeople(user.id, 20);
        }
        return this.exploreService.getPeople(user?.id, { lang, sort });
    }
    async getQuotedNow(user, lang, sort) {
        return this.exploreService.getQuotedNow(user?.id, 20, { lang, sort });
    }
    async getDeepDives(user, lang, sort) {
        return this.exploreService.getDeepDives(user?.id, 20, { lang, sort });
    }
    async getNewsroom(user, lang, sort) {
        return this.exploreService.getNewsroom(user?.id, 20, { lang, sort });
    }
    async getForYou(user, limit) {
        return this.recommendationService.getRecommendedPosts(user.id, limit ? parseInt(limit, 10) : 20);
    }
    async getRecommendedPeople(user, limit) {
        return this.recommendationService.getRecommendedPeople(user.id, limit ? parseInt(limit, 10) : 20);
    }
};
exports.ExploreController = ExploreController;
__decorate([
    (0, common_1.Get)('topics'),
    __param(0, (0, common_1.Query)('lang')),
    __param(1, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ExploreController.prototype, "getTopics", null);
__decorate([
    (0, common_1.Get)('people'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('lang')),
    __param(2, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ExploreController.prototype, "getPeople", null);
__decorate([
    (0, common_1.Get)('quoted-now'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('lang')),
    __param(2, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ExploreController.prototype, "getQuotedNow", null);
__decorate([
    (0, common_1.Get)('deep-dives'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('lang')),
    __param(2, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ExploreController.prototype, "getDeepDives", null);
__decorate([
    (0, common_1.Get)('newsroom'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('lang')),
    __param(2, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ExploreController.prototype, "getNewsroom", null);
__decorate([
    (0, common_1.Get)('for-you'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExploreController.prototype, "getForYou", null);
__decorate([
    (0, common_1.Get)('recommended-people'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExploreController.prototype, "getRecommendedPeople", null);
exports.ExploreController = ExploreController = __decorate([
    (0, common_1.Controller)('explore'),
    __metadata("design:paramtypes", [explore_service_1.ExploreService,
        recommendation_service_1.RecommendationService])
], ExploreController);
//# sourceMappingURL=explore.controller.js.map