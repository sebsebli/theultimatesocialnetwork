"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepliesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const replies_controller_1 = require("./replies.controller");
const replies_service_1 = require("./replies.service");
const reply_entity_1 = require("../entities/reply.entity");
const post_entity_1 = require("../entities/post.entity");
const mention_entity_1 = require("../entities/mention.entity");
const user_entity_1 = require("../entities/user.entity");
const language_detection_service_1 = require("../shared/language-detection.service");
const database_module_1 = require("../database/database.module");
const notifications_module_1 = require("../notifications/notifications.module");
const safety_module_1 = require("../safety/safety.module");
let RepliesModule = class RepliesModule {
};
exports.RepliesModule = RepliesModule;
exports.RepliesModule = RepliesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([reply_entity_1.Reply, post_entity_1.Post, mention_entity_1.Mention, user_entity_1.User]),
            database_module_1.DatabaseModule,
            notifications_module_1.NotificationsModule,
            safety_module_1.SafetyModule,
        ],
        controllers: [replies_controller_1.RepliesController],
        providers: [replies_service_1.RepliesService, language_detection_service_1.LanguageDetectionService],
        exports: [replies_service_1.RepliesService],
    })
], RepliesModule);
//# sourceMappingURL=replies.module.js.map