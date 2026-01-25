"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const language_detection_service_1 = require("./language-detection.service");
const notification_helper_service_1 = require("./notification-helper.service");
const notification_entity_1 = require("../entities/notification.entity");
const post_entity_1 = require("../entities/post.entity");
const user_entity_1 = require("../entities/user.entity");
let SharedModule = class SharedModule {
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([notification_entity_1.Notification, post_entity_1.Post, user_entity_1.User])],
        providers: [language_detection_service_1.LanguageDetectionService, notification_helper_service_1.NotificationHelperService],
        exports: [language_detection_service_1.LanguageDetectionService, notification_helper_service_1.NotificationHelperService],
    })
], SharedModule);
//# sourceMappingURL=shared.module.js.map