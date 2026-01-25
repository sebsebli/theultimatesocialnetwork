"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const push_controller_1 = require("./push.controller");
const push_service_1 = require("./push.service");
const push_token_entity_1 = require("../entities/push-token.entity");
const push_outbox_entity_1 = require("../entities/push-outbox.entity");
const notification_pref_entity_1 = require("../entities/notification-pref.entity");
const apns_sender_1 = require("./senders/apns.sender");
const fcm_sender_1 = require("./senders/fcm.sender");
const push_worker_1 = require("./push.worker");
let PushModule = class PushModule {
};
exports.PushModule = PushModule;
exports.PushModule = PushModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([push_token_entity_1.PushToken, push_outbox_entity_1.PushOutbox, notification_pref_entity_1.NotificationPref])],
        controllers: [push_controller_1.PushController],
        providers: [push_service_1.PushService, apns_sender_1.ApnsSender, fcm_sender_1.FcmSender, push_worker_1.PushWorker],
        exports: [push_service_1.PushService],
    })
], PushModule);
//# sourceMappingURL=push.module.js.map