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
exports.AdminInvitesController = exports.InvitesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const invites_service_1 = require("./invites.service");
const current_user_decorator_1 = require("../shared/current-user.decorator");
let InvitesController = class InvitesController {
    invitesService;
    constructor(invitesService) {
        this.invitesService = invitesService;
    }
    async generate(user) {
        const isBeta = await this.invitesService.isBetaMode();
        if (!isBeta) {
            throw new Error('Invite generation is disabled (Beta Over)');
        }
        const status = await this.invitesService.getMyInvites(user.id);
        if (status.remaining <= 0) {
            throw new Error('No invites remaining');
        }
        const code = await this.invitesService.generateCode(user.id);
        return { code };
    }
    async getMy(user) {
        return this.invitesService.getMyInvites(user.id);
    }
};
exports.InvitesController = InvitesController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitesController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitesController.prototype, "getMy", null);
exports.InvitesController = InvitesController = __decorate([
    (0, common_1.Controller)('invites'),
    __metadata("design:paramtypes", [invites_service_1.InvitesService])
], InvitesController);
let AdminInvitesController = class AdminInvitesController {
    invitesService;
    constructor(invitesService) {
        this.invitesService = invitesService;
    }
    async generateSystemInvite() {
        const code = await this.invitesService.generateCode(undefined);
        return { code };
    }
    async toggleBeta(body) {
        await this.invitesService.setBetaMode(body.enabled);
        return { success: true };
    }
};
exports.AdminInvitesController = AdminInvitesController;
__decorate([
    (0, common_1.Post)('invites/system'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminInvitesController.prototype, "generateSystemInvite", null);
__decorate([
    (0, common_1.Post)('beta-mode'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminInvitesController.prototype, "toggleBeta", null);
exports.AdminInvitesController = AdminInvitesController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [invites_service_1.InvitesService])
], AdminInvitesController);
//# sourceMappingURL=invites.controller.js.map