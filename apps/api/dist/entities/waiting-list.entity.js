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
exports.WaitingList = void 0;
const typeorm_1 = require("typeorm");
let WaitingList = class WaitingList {
    email;
    createdAt;
    ipHash;
    status;
};
exports.WaitingList = WaitingList;
__decorate([
    (0, typeorm_1.PrimaryColumn)('text'),
    __metadata("design:type", String)
], WaitingList.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], WaitingList.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_hash', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], WaitingList.prototype, "ipHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['PENDING', 'INVITED'], default: 'PENDING' }),
    __metadata("design:type", String)
], WaitingList.prototype, "status", void 0);
exports.WaitingList = WaitingList = __decorate([
    (0, typeorm_1.Entity)('waiting_list')
], WaitingList);
//# sourceMappingURL=waiting-list.entity.js.map