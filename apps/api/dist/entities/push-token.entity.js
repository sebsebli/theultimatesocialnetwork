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
exports.PushToken = exports.PushProvider = void 0;
const typeorm_1 = require("typeorm");
var PushProvider;
(function (PushProvider) {
    PushProvider["APNS"] = "APNS";
    PushProvider["FCM"] = "FCM";
})(PushProvider || (exports.PushProvider = PushProvider = {}));
let PushToken = class PushToken {
    id;
    userId;
    provider;
    token;
    platform;
    deviceId;
    appVersion;
    locale;
    apnsEnvironment;
    createdAt;
    lastSeenAt;
    disabledAt;
};
exports.PushToken = PushToken;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PushToken.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], PushToken.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PushProvider }),
    __metadata("design:type", String)
], PushToken.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PushToken.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PushToken.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_id', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PushToken.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'app_version', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PushToken.prototype, "appVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PushToken.prototype, "locale", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'apns_environment', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PushToken.prototype, "apnsEnvironment", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PushToken.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_seen_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PushToken.prototype, "lastSeenAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'disabled_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], PushToken.prototype, "disabledAt", void 0);
exports.PushToken = PushToken = __decorate([
    (0, typeorm_1.Entity)('push_tokens'),
    (0, typeorm_1.Unique)(['provider', 'token'])
], PushToken);
//# sourceMappingURL=push-token.entity.js.map