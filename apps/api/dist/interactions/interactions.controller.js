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
exports.InteractionsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const interactions_service_1 = require("./interactions.service");
const current_user_decorator_1 = require("../shared/current-user.decorator");
const optional_jwt_auth_guard_1 = require("../auth/optional-jwt-auth.guard");
let InteractionsController = class InteractionsController {
    interactionsService;
    constructor(interactionsService) {
        this.interactionsService = interactionsService;
    }
    async view(postId) {
        this.interactionsService.recordView(postId).catch(err => console.error('View record failed', err));
        return { ok: true };
    }
    async recordTime(user, postId, body) {
        await this.interactionsService.recordReadDuration(user.id, postId, body.duration);
        return { ok: true };
    }
    async like(user, postId) {
        return this.interactionsService.toggleLike(user.id, postId);
    }
    async keep(user, postId) {
        return this.interactionsService.toggleKeep(user.id, postId);
    }
};
exports.InteractionsController = InteractionsController;
__decorate([
    (0, common_1.Post)(':id/view'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InteractionsController.prototype, "view", null);
__decorate([
    (0, common_1.Post)(':id/read-time'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], InteractionsController.prototype, "recordTime", null);
__decorate([
    (0, common_1.Post)(':id/like'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InteractionsController.prototype, "like", null);
__decorate([
    (0, common_1.Post)(':id/keep'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InteractionsController.prototype, "keep", null);
exports.InteractionsController = InteractionsController = __decorate([
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [interactions_service_1.InteractionsService])
], InteractionsController);
//# sourceMappingURL=interactions.controller.js.map