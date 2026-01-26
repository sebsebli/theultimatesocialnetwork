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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const users_service_1 = require("./users.service");
const current_user_decorator_1 = require("../shared/current-user.decorator");
const bullmq_1 = require("bullmq");
let UsersController = class UsersController {
    usersService;
    exportQueue;
    constructor(usersService, exportQueue) {
        this.usersService = usersService;
        this.exportQueue = exportQueue;
    }
    async updateMe(user, updates) {
        const allowedUpdates = {
            displayName: updates.displayName,
            bio: updates.bio,
            isProtected: updates.isProtected,
            languages: updates.languages,
        };
        return this.usersService.update(user.id, allowedUpdates);
    }
    async getMe(user) {
        return this.usersService.findById(user.id);
    }
    async deleteMe(user) {
        return this.usersService.deleteUser(user.id);
    }
    async exportData(user) {
        await this.exportQueue.add('export-job', {
            userId: user.id,
            email: user.email || 'user@example.com'
        });
        return { message: 'Export started. You will receive an email shortly.' };
    }
    async getSuggested() {
        return this.usersService.getSuggested();
    }
    async getReplies(id) {
        return this.usersService.getReplies(id);
    }
    async getQuotes(id) {
        return this.usersService.getQuotes(id);
    }
    async findOne(handle) {
        return this.usersService.findByHandle(handle);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Delete)('me'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteMe", null);
__decorate([
    (0, common_1.Get)('me/export'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "exportData", null);
__decorate([
    (0, common_1.Get)('suggested'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getSuggested", null);
__decorate([
    (0, common_1.Get)(':id/replies'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getReplies", null);
__decorate([
    (0, common_1.Get)(':id/quotes'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getQuotes", null);
__decorate([
    (0, common_1.Get)(':handle'),
    __param(0, (0, common_1.Param)('handle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __param(1, (0, common_1.Inject)('EXPORT_QUEUE')),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        bullmq_1.Queue])
], UsersController);
//# sourceMappingURL=users.controller.js.map