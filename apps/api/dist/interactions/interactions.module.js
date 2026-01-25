"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const interactions_controller_1 = require("./interactions.controller");
const interactions_service_1 = require("./interactions.service");
const like_entity_1 = require("../entities/like.entity");
const keep_entity_1 = require("../entities/keep.entity");
const post_entity_1 = require("../entities/post.entity");
const post_read_entity_1 = require("../entities/post-read.entity");
const shared_module_1 = require("../shared/shared.module");
const ioredis_1 = __importDefault(require("ioredis"));
let InteractionsModule = class InteractionsModule {
};
exports.InteractionsModule = InteractionsModule;
exports.InteractionsModule = InteractionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([like_entity_1.Like, keep_entity_1.Keep, post_entity_1.Post, post_read_entity_1.PostRead]),
            shared_module_1.SharedModule,
            config_1.ConfigModule,
        ],
        controllers: [interactions_controller_1.InteractionsController],
        providers: [
            interactions_service_1.InteractionsService,
            {
                provide: 'REDIS_CLIENT',
                useFactory: (config) => {
                    const redisUrl = config.get('REDIS_URL');
                    return new ioredis_1.default(redisUrl || 'redis://redis:6379');
                },
                inject: [config_1.ConfigService],
            },
        ],
    })
], InteractionsModule);
//# sourceMappingURL=interactions.module.js.map