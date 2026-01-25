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
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const meilisearch_service_1 = require("./meilisearch.service");
const current_user_decorator_1 = require("../shared/current-user.decorator");
let SearchController = class SearchController {
    meilisearch;
    constructor(meilisearch) {
        this.meilisearch = meilisearch;
    }
    async searchPosts(user, query, limit, offset, lang) {
        if (!query || query.trim().length === 0) {
            return { hits: [], estimatedTotalHits: 0 };
        }
        const results = await this.meilisearch.searchPosts(query, {
            limit: limit ? parseInt(limit, 10) : 20,
            offset: offset ? parseInt(offset, 10) : 0,
            lang,
        });
        return results;
    }
    async searchUsers(query, limit) {
        if (!query || query.trim().length === 0) {
            return { hits: [] };
        }
        return this.meilisearch.searchUsers(query, limit ? parseInt(limit, 10) : 10);
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)('posts'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __param(4, (0, common_1.Query)('lang')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchPosts", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchUsers", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.Controller)('search'),
    __metadata("design:paramtypes", [meilisearch_service_1.MeilisearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map