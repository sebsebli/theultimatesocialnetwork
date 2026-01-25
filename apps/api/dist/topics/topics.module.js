"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const topics_controller_1 = require("./topics.controller");
const topics_service_1 = require("./topics.service");
const topic_follows_service_1 = require("./topic-follows.service");
const topic_entity_1 = require("../entities/topic.entity");
const topic_follow_entity_1 = require("../entities/topic-follow.entity");
const post_topic_entity_1 = require("../entities/post-topic.entity");
const post_entity_1 = require("../entities/post.entity");
const explore_module_1 = require("../explore/explore.module");
let TopicsModule = class TopicsModule {
};
exports.TopicsModule = TopicsModule;
exports.TopicsModule = TopicsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([topic_entity_1.Topic, topic_follow_entity_1.TopicFollow, post_topic_entity_1.PostTopic, post_entity_1.Post]),
            (0, common_1.forwardRef)(() => explore_module_1.ExploreModule),
        ],
        controllers: [topics_controller_1.TopicsController],
        providers: [topics_service_1.TopicsService, topic_follows_service_1.TopicFollowsService],
        exports: [topics_service_1.TopicsService],
    })
], TopicsModule);
//# sourceMappingURL=topics.module.js.map