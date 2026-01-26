"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisIoAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("redis");
const common_1 = require("@nestjs/common");
class RedisIoAdapter extends platform_socket_io_1.IoAdapter {
    app;
    configService;
    adapterConstructor;
    logger = new common_1.Logger(RedisIoAdapter.name);
    constructor(app, configService) {
        super(app);
        this.app = app;
        this.configService = configService;
    }
    async connectToRedis() {
        const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
        const pubClient = (0, redis_1.createClient)({ url: redisUrl });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        this.adapterConstructor = (0, redis_adapter_1.createAdapter)(pubClient, subClient);
        this.logger.log(`Redis adapter connected to ${redisUrl}`);
    }
    createIOServer(port, options) {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }
}
exports.RedisIoAdapter = RedisIoAdapter;
//# sourceMappingURL=redis-io.adapter.js.map