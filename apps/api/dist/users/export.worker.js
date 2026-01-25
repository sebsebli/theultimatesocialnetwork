"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ExportWorker_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportWorker = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const bullmq_1 = require("bullmq");
const config_1 = require("@nestjs/config");
const archiver_1 = __importDefault(require("archiver"));
const nodemailer = __importStar(require("nodemailer"));
const ioredis_1 = __importDefault(require("ioredis"));
let ExportWorker = ExportWorker_1 = class ExportWorker {
    usersService;
    configService;
    redis;
    logger = new common_1.Logger(ExportWorker_1.name);
    worker;
    constructor(usersService, configService, redis) {
        this.usersService = usersService;
        this.configService = configService;
        this.redis = redis;
    }
    onApplicationBootstrap() {
        const redisUrl = this.configService.get('REDIS_URL');
        this.worker = new bullmq_1.Worker('data-export', async (job) => {
            this.logger.log(`Processing export for user ${job.data.userId}`);
            await this.processExport(job.data.userId, job.data.email);
        }, {
            connection: new ioredis_1.default(redisUrl || 'redis://redis:6379', { maxRetriesPerRequest: null })
        });
        this.worker.on('failed', (job, err) => {
            this.logger.error(`Job ${job?.id} failed: ${err.message}`);
        });
    }
    onApplicationShutdown() {
        this.worker.close();
    }
    async processExport(userId, userEmail) {
        const data = await this.usersService.exportUserData(userId);
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        const chunks = [];
        archive.on('data', (chunk) => chunks.push(chunk));
        return new Promise((resolve, reject) => {
            archive.on('end', async () => {
                const resultBuffer = Buffer.concat(chunks);
                await this.sendEmail(userEmail, resultBuffer);
                resolve();
            });
            archive.on('error', (err) => reject(err));
            archive.append(JSON.stringify(data.user, null, 2), { name: 'profile.json' });
            archive.append(JSON.stringify(data.posts, null, 2), { name: 'posts.json' });
            archive.append(JSON.stringify(data.replies, null, 2), { name: 'replies.json' });
            archive.append(JSON.stringify(data.readHistory, null, 2), { name: 'reading-history.json' });
            archive.append(JSON.stringify(data.likes, null, 2), { name: 'likes.json' });
            archive.append(JSON.stringify(data.keeps, null, 2), { name: 'keeps.json' });
            archive.append(JSON.stringify(data.followers, null, 2), { name: 'followers.json' });
            archive.append(JSON.stringify(data.following, null, 2), { name: 'following.json' });
            archive.finalize();
        });
    }
    async sendEmail(to, attachment) {
        const host = this.configService.get('SMTP_HOST');
        if (!host) {
            this.logger.log(`[MOCK EMAIL] To: ${to} | Subject: Your Data Export | Attachment Size: ${attachment.length} bytes`);
            return;
        }
        const transporter = nodemailer.createTransport({
            host: host,
            port: parseInt(this.configService.get('SMTP_PORT') || '587'),
            secure: this.configService.get('SMTP_SECURE') === 'true',
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
        await transporter.sendMail({
            from: '"Cite System" <noreply@cite.com>',
            to: to,
            subject: 'Your Data Export',
            text: 'Attached is your requested data export.',
            attachments: [
                {
                    filename: 'cite-export.zip',
                    content: attachment,
                },
            ],
        });
        this.logger.log(`Email sent to ${to}`);
    }
};
exports.ExportWorker = ExportWorker;
exports.ExportWorker = ExportWorker = ExportWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [users_service_1.UsersService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof ioredis_1.default !== "undefined" && ioredis_1.default) === "function" ? _b : Object])
], ExportWorker);
//# sourceMappingURL=export.worker.js.map