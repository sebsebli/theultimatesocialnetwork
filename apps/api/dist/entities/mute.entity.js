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
exports.Mute = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let Mute = class Mute {
    muterId;
    mutedId;
    muter;
    muted;
    createdAt;
};
exports.Mute = Mute;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'muter_id' }),
    __metadata("design:type", String)
], Mute.prototype, "muterId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'muted_id' }),
    __metadata("design:type", String)
], Mute.prototype, "mutedId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'muter_id' }),
    __metadata("design:type", user_entity_1.User)
], Mute.prototype, "muter", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'muted_id' }),
    __metadata("design:type", user_entity_1.User)
], Mute.prototype, "muted", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Mute.prototype, "createdAt", void 0);
exports.Mute = Mute = __decorate([
    (0, typeorm_1.Entity)('mutes')
], Mute);
//# sourceMappingURL=mute.entity.js.map