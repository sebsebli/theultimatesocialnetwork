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
exports.DmThread = void 0;
const typeorm_1 = require("typeorm");
let DmThread = class DmThread {
    id;
    userA;
    userB;
    createdAt;
};
exports.DmThread = DmThread;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DmThread.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_a' }),
    __metadata("design:type", String)
], DmThread.prototype, "userA", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_b' }),
    __metadata("design:type", String)
], DmThread.prototype, "userB", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DmThread.prototype, "createdAt", void 0);
exports.DmThread = DmThread = __decorate([
    (0, typeorm_1.Entity)('dm_threads')
], DmThread);
//# sourceMappingURL=dm-thread.entity.js.map