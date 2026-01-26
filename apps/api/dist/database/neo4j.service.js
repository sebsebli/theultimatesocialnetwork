"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Neo4jService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
let Neo4jService = class Neo4jService {
    configService;
    driver;
    isHealthy = false;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const uri = this.configService.get('NEO4J_URI') || 'bolt://localhost:7687';
        const user = this.configService.get('NEO4J_USER') || 'neo4j';
        const password = this.configService.get('NEO4J_PASSWORD') || 'password';
        this.driver = neo4j_driver_1.default.driver(uri, neo4j_driver_1.default.auth.basic(user, password));
        try {
            await this.driver.getServerInfo();
            this.isHealthy = true;
            console.log('Connected to Neo4j');
        }
        catch (e) {
            this.isHealthy = false;
            console.error('Failed to connect to Neo4j. Graph features will be disabled.', e.message);
        }
    }
    async onModuleDestroy() {
        if (this.driver) {
            await this.driver.close();
        }
    }
    getStatus() {
        return { healthy: this.isHealthy };
    }
    getSession() {
        return this.driver.session();
    }
    async run(query, params = {}) {
        if (!this.isHealthy) {
            return { records: [] };
        }
        const session = this.getSession();
        try {
            const result = await session.run(query, params);
            return result;
        }
        catch (error) {
            this.isHealthy = false;
            throw error;
        }
        finally {
            await session.close();
        }
    }
};
exports.Neo4jService = Neo4jService;
exports.Neo4jService = Neo4jService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], Neo4jService);
//# sourceMappingURL=neo4j.service.js.map