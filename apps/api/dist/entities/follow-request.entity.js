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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowRequest = exports.FollowRequestStatus = void 0;
const typeorm_1 = require("typeorm");
var FollowRequestStatus;
(function (FollowRequestStatus) {
    FollowRequestStatus["PENDING"] = "PENDING";
    FollowRequestStatus["APPROVED"] = "APPROVED";
    FollowRequestStatus["REJECTED"] = "REJECTED";
})(FollowRequestStatus || (exports.FollowRequestStatus = FollowRequestStatus = {}));
let FollowRequest = class FollowRequest {
    id;
    requesterId;
    targetId;
    status;
    createdAt;
};
exports.FollowRequest = FollowRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FollowRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requester_id' }),
    __metadata("design:type", String)
], FollowRequest.prototype, "requesterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_id' }),
    __metadata("design:type", String)
], FollowRequest.prototype, "targetId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FollowRequestStatus,
        default: FollowRequestStatus.PENDING,
    }),
    __metadata("design:type", String)
], FollowRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], FollowRequest.prototype, "createdAt", void 0);
exports.FollowRequest = FollowRequest = __decorate([
    (0, typeorm_1.Entity)('follow_requests')
], FollowRequest);
//# sourceMappingURL=follow-request.entity.js.map