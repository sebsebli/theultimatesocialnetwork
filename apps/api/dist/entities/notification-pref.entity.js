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
exports.NotificationPref = void 0;
const typeorm_1 = require("typeorm");
let NotificationPref = class NotificationPref {
    userId;
    pushEnabled;
    replies;
    quotes;
    mentions;
    dms;
    follows;
    saves;
    quietHoursStart;
    quietHoursEnd;
};
exports.NotificationPref = NotificationPref;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'user_id' }),
    __metadata("design:type", String)
], NotificationPref.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'push_enabled', default: true }),
    __metadata("design:type", Boolean)
], NotificationPref.prototype, "pushEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], NotificationPref.prototype, "replies", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], NotificationPref.prototype, "quotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], NotificationPref.prototype, "mentions", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], NotificationPref.prototype, "dms", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], NotificationPref.prototype, "follows", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], NotificationPref.prototype, "saves", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quiet_hours_start', type: 'smallint', nullable: true }),
    __metadata("design:type", Number)
], NotificationPref.prototype, "quietHoursStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quiet_hours_end', type: 'smallint', nullable: true }),
    __metadata("design:type", Number)
], NotificationPref.prototype, "quietHoursEnd", void 0);
exports.NotificationPref = NotificationPref = __decorate([
    (0, typeorm_1.Entity)('notification_prefs')
], NotificationPref);
//# sourceMappingURL=notification-pref.entity.js.map