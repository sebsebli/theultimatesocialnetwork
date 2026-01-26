"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const nestjs_throttler_storage_redis_1 = require("nestjs-throttler-storage-redis");
const core_1 = require("@nestjs/core");
const database_module_1 = require("./database/database.module");
const app_controller_1 = require("./app.controller");
const health_controller_1 = require("./health.controller");
const app_service_1 = require("./app.service");
const posts_module_1 = require("./posts/posts.module");
const auth_module_1 = require("./auth/auth.module");
const feed_module_1 = require("./feed/feed.module");
const interactions_module_1 = require("./interactions/interactions.module");
const collections_module_1 = require("./collections/collections.module");
const topics_module_1 = require("./topics/topics.module");
const explore_module_1 = require("./explore/explore.module");
const notifications_module_1 = require("./notifications/notifications.module");
const push_module_1 = require("./push/push.module");
const reports_module_1 = require("./reports/reports.module");
const users_module_1 = require("./users/users.module");
const search_module_1 = require("./search/search.module");
const replies_module_1 = require("./replies/replies.module");
const follows_module_1 = require("./follows/follows.module");
const messages_module_1 = require("./messages/messages.module");
const upload_module_1 = require("./upload/upload.module");
const safety_module_1 = require("./safety/safety.module");
const keeps_module_1 = require("./keeps/keeps.module");
const realtime_module_1 = require("./realtime/realtime.module");
const cleanup_service_1 = require("./cleanup/cleanup.service");
const typeorm_1 = require("@nestjs/typeorm");
const rss_module_1 = require("./rss/rss.module");
const post_entity_1 = require("./entities/post.entity");
const user_entity_1 = require("./entities/user.entity");
const nestjs_pino_1 = require("nestjs-pino");
const nestjs_prometheus_1 = require("@willsoto/nestjs-prometheus");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_prometheus_1.PrometheusModule.register({
                path: '/metrics',
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    customProps: (req, res) => ({
                        context: 'HTTP',
                    }),
                    transport: process.env.NODE_ENV !== 'production' ? {
                        target: 'pino-pretty',
                        options: {
                            singleLine: true,
                        },
                    } : undefined,
                },
            }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '../../.env',
            }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    throttlers: [{
                            ttl: 60000,
                            limit: 100,
                        }],
                    storage: new nestjs_throttler_storage_redis_1.ThrottlerStorageRedisService(config.get('REDIS_URL') || 'redis://localhost:6379'),
                }),
            }),
            database_module_1.DatabaseModule,
            typeorm_1.TypeOrmModule.forFeature([post_entity_1.Post, user_entity_1.User]),
            posts_module_1.PostsModule,
            auth_module_1.AuthModule,
            feed_module_1.FeedModule,
            interactions_module_1.InteractionsModule,
            collections_module_1.CollectionsModule,
            topics_module_1.TopicsModule,
            explore_module_1.ExploreModule,
            notifications_module_1.NotificationsModule,
            push_module_1.PushModule,
            reports_module_1.ReportsModule,
            users_module_1.UsersModule,
            search_module_1.SearchModule,
            replies_module_1.RepliesModule,
            follows_module_1.FollowsModule,
            messages_module_1.MessagesModule,
            upload_module_1.UploadModule,
            safety_module_1.SafetyModule,
            keeps_module_1.KeepsModule,
            realtime_module_1.RealtimeModule,
            rss_module_1.RssModule,
        ],
        controllers: [app_controller_1.AppController, health_controller_1.HealthController],
        providers: [
            app_service_1.AppService,
            cleanup_service_1.CleanupService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map