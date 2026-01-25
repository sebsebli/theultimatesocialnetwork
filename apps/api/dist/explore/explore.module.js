"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExploreModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const explore_controller_1 = require("./explore.controller");
const explore_service_1 = require("./explore.service");
const recommendation_service_1 = require("./recommendation.service");
const topic_entity_1 = require("../entities/topic.entity");
const user_entity_1 = require("../entities/user.entity");
const post_entity_1 = require("../entities/post.entity");
const post_edge_entity_1 = require("../entities/post-edge.entity");
const follow_entity_1 = require("../entities/follow.entity");
const external_source_entity_1 = require("../entities/external-source.entity");
const post_topic_entity_1 = require("../entities/post-topic.entity");
const like_entity_1 = require("../entities/like.entity");
const keep_entity_1 = require("../entities/keep.entity");
const database_module_1 = require("../database/database.module");
let ExploreModule = class ExploreModule {
};
exports.ExploreModule = ExploreModule;
exports.ExploreModule = ExploreModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                topic_entity_1.Topic,
                user_entity_1.User,
                post_entity_1.Post,
                post_edge_entity_1.PostEdge,
                follow_entity_1.Follow,
                external_source_entity_1.ExternalSource,
                post_topic_entity_1.PostTopic,
                like_entity_1.Like,
                keep_entity_1.Keep,
            ]),
            database_module_1.DatabaseModule,
        ],
        controllers: [explore_controller_1.ExploreController],
        providers: [explore_service_1.ExploreService, recommendation_service_1.RecommendationService],
        exports: [explore_service_1.ExploreService, recommendation_service_1.RecommendationService],
    })
], ExploreModule);
//# sourceMappingURL=explore.module.js.map