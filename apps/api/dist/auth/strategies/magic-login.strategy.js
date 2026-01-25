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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MagicLoginStrategyImpl_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MagicLoginStrategyImpl = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_magic_login_1 = __importDefault(require("passport-magic-login"));
const auth_service_1 = require("../auth.service");
const email_service_1 = require("../../shared/email.service");
const config_1 = require("@nestjs/config");
let MagicLoginStrategyImpl = MagicLoginStrategyImpl_1 = class MagicLoginStrategyImpl extends (0, passport_1.PassportStrategy)(passport_magic_login_1.default) {
    authService;
    emailService;
    configService;
    logger = new common_1.Logger(MagicLoginStrategyImpl_1.name);
    constructor(authService, emailService, configService) {
        super({
            secret: configService.get('SUPABASE_JWT_SECRET') || 'secret',
            jwtOptions: {
                expiresIn: '15m',
            },
            callbackUrl: (configService.get('FRONTEND_URL') || 'http://localhost:3001') + '/verify',
            sendMagicLink: async (destination, href) => {
                await this.emailService.sendMagicLink(destination, href, 'en');
            },
            verify: async (payload, callback) => {
                try {
                    const user = await this.authService.validateOrCreateUser(payload.destination, payload.inviteCode);
                    callback(null, user);
                }
                catch (err) {
                    callback(err);
                }
            },
            getPayload: (destination, req) => {
                return {
                    destination,
                    inviteCode: req.body.inviteCode
                };
            }
        });
        this.authService = authService;
        this.emailService = emailService;
        this.configService = configService;
    }
};
exports.MagicLoginStrategyImpl = MagicLoginStrategyImpl;
exports.MagicLoginStrategyImpl = MagicLoginStrategyImpl = MagicLoginStrategyImpl_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        email_service_1.EmailService,
        config_1.ConfigService])
], MagicLoginStrategyImpl);
//# sourceMappingURL=magic-login.strategy.js.map