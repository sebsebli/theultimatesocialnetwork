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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const report_entity_1 = require("../entities/report.entity");
const safety_service_1 = require("../safety/safety.service");
let ReportsService = class ReportsService {
    reportRepo;
    safetyService;
    constructor(reportRepo, safetyService) {
        this.reportRepo = reportRepo;
        this.safetyService = safetyService;
    }
    async create(userId, targetId, targetType, reason) {
        const report = await this.reportRepo.save({
            reporterId: userId,
            targetId,
            targetType,
            reason,
        });
        return report;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(report_entity_1.Report)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => safety_service_1.SafetyService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        safety_service_1.SafetyService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map