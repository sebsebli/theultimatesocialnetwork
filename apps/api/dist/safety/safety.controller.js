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
exports.SafetyController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const safety_service_1 = require("./safety.service");
const current_user_decorator_1 = require("../shared/current-user.decorator");
let SafetyController = class SafetyController {
    safetyService;
    constructor(safetyService) {
        this.safetyService = safetyService;
    }
    async block(user, blockedId) {
        return this.safetyService.block(user.id, blockedId);
    }
    async unblock(user, blockedId) {
        return this.safetyService.unblock(user.id, blockedId);
    }
    async mute(user, mutedId) {
        return this.safetyService.mute(user.id, mutedId);
    }
    async unmute(user, mutedId) {
        return this.safetyService.unmute(user.id, mutedId);
    }
    async report(user, dto) {
        return this.safetyService.report(user.id, dto.targetId, dto.targetType, dto.reason);
    }
    async getBlocked(user) {
        return this.safetyService.getBlocked(user.id);
    }
    async getMuted(user) {
        return this.safetyService.getMuted(user.id);
    }
};
exports.SafetyController = SafetyController;
__decorate([
    (0, common_1.Post)('block/:userId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "block", null);
__decorate([
    (0, common_1.Delete)('block/:userId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "unblock", null);
__decorate([
    (0, common_1.Post)('mute/:userId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "mute", null);
__decorate([
    (0, common_1.Delete)('mute/:userId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "unmute", null);
__decorate([
    (0, common_1.Post)('report'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "report", null);
__decorate([
    (0, common_1.Get)('blocked'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "getBlocked", null);
__decorate([
    (0, common_1.Get)('muted'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "getMuted", null);
exports.SafetyController = SafetyController = __decorate([
    (0, common_1.Controller)('safety'),
    __metadata("design:paramtypes", [safety_service_1.SafetyService])
], SafetyController);
//# sourceMappingURL=safety.controller.js.map