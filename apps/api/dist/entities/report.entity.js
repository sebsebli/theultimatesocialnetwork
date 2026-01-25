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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = exports.ReportStatus = exports.ReportTargetType = void 0;
const typeorm_1 = require("typeorm");
var ReportTargetType;
(function (ReportTargetType) {
    ReportTargetType["POST"] = "POST";
    ReportTargetType["REPLY"] = "REPLY";
    ReportTargetType["USER"] = "USER";
    ReportTargetType["DM"] = "DM";
})(ReportTargetType || (exports.ReportTargetType = ReportTargetType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["OPEN"] = "OPEN";
    ReportStatus["REVIEWED"] = "REVIEWED";
    ReportStatus["ACTIONED"] = "ACTIONED";
    ReportStatus["DISMISSED"] = "DISMISSED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
let Report = class Report {
    id;
    reporterId;
    targetType;
    targetId;
    reason;
    createdAt;
    status;
};
exports.Report = Report;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Report.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reporter_id' }),
    __metadata("design:type", String)
], Report.prototype, "reporterId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ReportTargetType,
        name: 'target_type',
    }),
    __metadata("design:type", String)
], Report.prototype, "targetType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_id' }),
    __metadata("design:type", String)
], Report.prototype, "targetId", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Report.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Report.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ReportStatus,
        default: ReportStatus.OPEN,
    }),
    __metadata("design:type", String)
], Report.prototype, "status", void 0);
exports.Report = Report = __decorate([
    (0, typeorm_1.Entity)('reports')
], Report);
//# sourceMappingURL=report.entity.js.map