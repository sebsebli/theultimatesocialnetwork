"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const posts_controller_1 = require("./posts.controller");
const posts_service_1 = require("./posts.service");
const post_entity_1 = require("../entities/post.entity");
const external_source_entity_1 = require("../entities/external-source.entity");
const mention_entity_1 = require("../entities/mention.entity");
const user_entity_1 = require("../entities/user.entity");
const database_module_1 = require("../database/database.module");
const search_module_1 = require("../search/search.module");
const notifications_module_1 = require("../notifications/notifications.module");
const shared_module_1 = require("../shared/shared.module");
const safety_module_1 = require("../safety/safety.module");
let PostsModule = class PostsModule {
};
exports.PostsModule = PostsModule;
exports.PostsModule = PostsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([post_entity_1.Post, external_source_entity_1.ExternalSource, mention_entity_1.Mention, user_entity_1.User]),
            database_module_1.DatabaseModule,
            search_module_1.SearchModule,
            notifications_module_1.NotificationsModule,
            shared_module_1.SharedModule,
            safety_module_1.SafetyModule,
        ],
        controllers: [posts_controller_1.PostsController],
        providers: [posts_service_1.PostsService],
        exports: [posts_service_1.PostsService],
    })
], PostsModule);
//# sourceMappingURL=posts.module.js.map