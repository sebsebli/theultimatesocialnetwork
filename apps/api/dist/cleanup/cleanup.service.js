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
var CleanupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("../entities/post.entity");
const user_entity_1 = require("../entities/user.entity");
let CleanupService = CleanupService_1 = class CleanupService {
    postRepo;
    userRepo;
    logger = new common_1.Logger(CleanupService_1.name);
    constructor(postRepo, userRepo) {
        this.postRepo = postRepo;
        this.userRepo = userRepo;
    }
    async handleCron() {
        this.logger.log('Running daily cleanup...');
        await this.deleteOldSoftDeletedPosts();
        await this.deleteOldSoftDeletedUsers();
    }
    async deleteOldSoftDeletedPosts() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const result = await this.postRepo
            .createQueryBuilder()
            .delete()
            .from(post_entity_1.Post)
            .where('deleted_at IS NOT NULL')
            .andWhere('deleted_at < :date', { date: thirtyDaysAgo })
            .execute();
        if (result.affected && result.affected > 0) {
            this.logger.log(`Hard deleted ${result.affected} old posts.`);
        }
    }
    async deleteOldSoftDeletedUsers() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const result = await this.userRepo
            .createQueryBuilder()
            .delete()
            .from(user_entity_1.User)
            .where('deleted_at IS NOT NULL')
            .andWhere('deleted_at < :date', { date: thirtyDaysAgo })
            .execute();
        if (result.affected && result.affected > 0) {
            this.logger.log(`Hard deleted ${result.affected} old users.`);
        }
    }
};
exports.CleanupService = CleanupService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CleanupService.prototype, "handleCron", null);
exports.CleanupService = CleanupService = CleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CleanupService);
//# sourceMappingURL=cleanup.service.js.map