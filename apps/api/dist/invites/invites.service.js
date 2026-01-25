"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const invite_entity_1 = require("../entities/invite.entity");
const user_entity_1 = require("../entities/user.entity");
const waiting_list_entity_1 = require("../entities/waiting-list.entity");
const system_setting_entity_1 = require("../entities/system-setting.entity");
const crypto = __importStar(require("crypto"));
let InvitesService = class InvitesService {
    inviteRepo;
    userRepo;
    waitingListRepo;
    settingsRepo;
    constructor(inviteRepo, userRepo, waitingListRepo, settingsRepo) {
        this.inviteRepo = inviteRepo;
        this.userRepo = userRepo;
        this.waitingListRepo = waitingListRepo;
        this.settingsRepo = settingsRepo;
    }
    async isBetaMode() {
        const setting = await this.settingsRepo.findOne({ where: { key: 'BETA_MODE' } });
        return setting ? setting.value === 'true' : true;
    }
    async setBetaMode(enabled) {
        await this.settingsRepo.save({
            key: 'BETA_MODE',
            value: String(enabled),
        });
    }
    async generateCode(userId) {
        const isBeta = await this.isBetaMode();
        if (!isBeta) {
        }
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        await this.inviteRepo.save({
            code,
            creatorId: userId || null,
        });
        if (userId) {
            await this.userRepo.decrement({ id: userId }, 'invitesRemaining', 1);
        }
        return code;
    }
    async validateCode(code) {
        const invite = await this.inviteRepo.findOne({ where: { code }, relations: ['creator'] });
        if (!invite)
            throw new common_1.NotFoundException('Invalid invite code');
        if (invite.usedAt)
            throw new common_1.ForbiddenException('Invite code already used');
        return invite;
    }
    async consumeCode(code, userId) {
        const invite = await this.inviteRepo.findOne({ where: { code } });
        if (!invite || invite.usedAt)
            return;
        invite.usedById = userId;
        invite.usedAt = new Date();
        await this.inviteRepo.save(invite);
    }
    async getMyInvites(userId) {
        const codes = await this.inviteRepo.find({
            where: { creatorId: userId, usedAt: (0, typeorm_2.IsNull)() },
        });
        const user = await this.userRepo.findOne({ where: { id: userId } });
        return {
            codes,
            remaining: user?.invitesRemaining || 0,
        };
    }
    async addToWaitingList(email, ipHash) {
        const existing = await this.waitingListRepo.findOne({ where: { email } });
        if (existing)
            return;
        if (ipHash) {
            const count = await this.waitingListRepo.count({ where: { ipHash } });
            if (count > 5)
                throw new common_1.ForbiddenException('Too many requests from this IP');
        }
        await this.waitingListRepo.save({
            email,
            ipHash,
            status: 'PENDING',
        });
    }
};
exports.InvitesService = InvitesService;
exports.InvitesService = InvitesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(invite_entity_1.Invite)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(waiting_list_entity_1.WaitingList)),
    __param(3, (0, typeorm_1.InjectRepository)(system_setting_entity_1.SystemSetting)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InvitesService);
//# sourceMappingURL=invites.service.js.map