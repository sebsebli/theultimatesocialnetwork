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
exports.PushController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const push_service_1 = require("./push.service");
const register_push_token_dto_1 = require("./dto/register-push-token.dto");
const current_user_decorator_1 = require("../shared/current-user.decorator");
let PushController = class PushController {
    pushService;
    constructor(pushService) {
        this.pushService = pushService;
    }
    async register(user, dto) {
        await this.pushService.register(user.id, dto);
        return { ok: true };
    }
};
exports.PushController = PushController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_push_token_dto_1.RegisterPushTokenDto]),
    __metadata("design:returntype", Promise)
], PushController.prototype, "register", null);
exports.PushController = PushController = __decorate([
    (0, common_1.Controller)('me/push-tokens'),
    __metadata("design:paramtypes", [push_service_1.PushService])
], PushController);
//# sourceMappingURL=push.controller.js.map