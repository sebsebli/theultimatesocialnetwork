"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const feed_controller_1 = require("./feed.controller");
const feed_service_1 = require("./feed.service");
const post_entity_1 = require("../entities/post.entity");
const follow_entity_1 = require("../entities/follow.entity");
const collection_item_entity_1 = require("../entities/collection-item.entity");
const collection_entity_1 = require("../entities/collection.entity");
const user_entity_1 = require("../entities/user.entity");
let FeedModule = class FeedModule {
};
exports.FeedModule = FeedModule;
exports.FeedModule = FeedModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([post_entity_1.Post, follow_entity_1.Follow, collection_item_entity_1.CollectionItem, collection_entity_1.Collection, user_entity_1.User])],
        controllers: [feed_controller_1.FeedController],
        providers: [feed_service_1.FeedService],
    })
], FeedModule);
//# sourceMappingURL=feed.module.js.map