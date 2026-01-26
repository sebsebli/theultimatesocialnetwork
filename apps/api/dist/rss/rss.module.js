"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RssModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const rss_controller_1 = require("./rss.controller");
const rss_service_1 = require("./rss.service");
const user_entity_1 = require("../entities/user.entity");
const post_entity_1 = require("../entities/post.entity");
let RssModule = class RssModule {
};
exports.RssModule = RssModule;
exports.RssModule = RssModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, post_entity_1.Post])],
        controllers: [rss_controller_1.RssController],
        providers: [rss_service_1.RssService],
    })
], RssModule);
//# sourceMappingURL=rss.module.js.map