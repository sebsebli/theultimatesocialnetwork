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
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const users_controller_1 = require("./users.controller");
const users_service_1 = require("./users.service");
const user_entity_1 = require("../entities/user.entity");
const post_entity_1 = require("../entities/post.entity");
const reply_entity_1 = require("../entities/reply.entity");
const post_edge_entity_1 = require("../entities/post-edge.entity");
const like_entity_1 = require("../entities/like.entity");
const keep_entity_1 = require("../entities/keep.entity");
const follow_entity_1 = require("../entities/follow.entity");
const post_read_entity_1 = require("../entities/post-read.entity");
const notification_entity_1 = require("../entities/notification.entity");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const export_worker_1 = require("./export.worker");
const bullmq_1 = require("bullmq");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User, post_entity_1.Post, reply_entity_1.Reply, post_edge_entity_1.PostEdge,
                like_entity_1.Like, keep_entity_1.Keep, follow_entity_1.Follow, post_read_entity_1.PostRead, notification_entity_1.Notification
            ]),
            config_1.ConfigModule,
        ],
        controllers: [users_controller_1.UsersController],
        providers: [
            users_service_1.UsersService,
            export_worker_1.ExportWorker,
            {
                provide: 'REDIS_CLIENT',
                useFactory: (config) => {
                    const redisUrl = config.get('REDIS_URL');
                    return new ioredis_1.default(redisUrl || 'redis://redis:6379');
                },
                inject: [config_1.ConfigService],
            },
            {
                provide: 'EXPORT_QUEUE',
                useFactory: (config) => {
                    const redisUrl = config.get('REDIS_URL');
                    return new bullmq_1.Queue('data-export', {
                        connection: new ioredis_1.default(redisUrl || 'redis://redis:6379', { maxRetriesPerRequest: null })
                    });
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [users_service_1.UsersService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map