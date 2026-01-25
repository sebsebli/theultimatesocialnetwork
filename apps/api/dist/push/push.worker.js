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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PushWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushWorker = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const push_outbox_entity_1 = require("../entities/push-outbox.entity");
const push_token_entity_1 = require("../entities/push-token.entity");
const apns_sender_1 = require("./senders/apns.sender");
const fcm_sender_1 = require("./senders/fcm.sender");
let PushWorker = PushWorker_1 = class PushWorker {
    outboxRepo;
    tokenRepo;
    apnsSender;
    fcmSender;
    logger = new common_1.Logger(PushWorker_1.name);
    isRunning = false;
    intervalId = null;
    constructor(outboxRepo, tokenRepo, apnsSender, fcmSender) {
        this.outboxRepo = outboxRepo;
        this.tokenRepo = tokenRepo;
        this.apnsSender = apnsSender;
        this.fcmSender = fcmSender;
    }
    onApplicationBootstrap() {
        this.start();
    }
    onApplicationShutdown() {
        this.stop();
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.logger.log('Push worker started');
        this.intervalId = setInterval(() => this.processOutbox(), 5000);
    }
    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    async processOutbox() {
        try {
            const pendingItems = await this.outboxRepo.find({
                where: { status: push_outbox_entity_1.PushStatus.PENDING },
                take: 50,
                order: { priority: 'DESC', createdAt: 'ASC' },
            });
            if (pendingItems.length === 0)
                return;
            this.logger.debug(`Processing ${pendingItems.length} push items`);
            for (const item of pendingItems) {
                await this.processItem(item);
            }
        }
        catch (error) {
            this.logger.error('Error processing push outbox', error);
        }
    }
    async processItem(item) {
        try {
            const tokens = await this.tokenRepo.find({
                where: { userId: item.userId, disabledAt: (0, typeorm_2.IsNull)() },
            });
            if (tokens.length === 0) {
                item.status = push_outbox_entity_1.PushStatus.SENT;
                item.sentAt = new Date();
                await this.outboxRepo.save(item);
                return;
            }
            const results = await Promise.all(tokens.map((token) => this.sendToToken(token, item)));
            const allFailed = results.every((r) => !r.ok);
            if (allFailed) {
                item.status = push_outbox_entity_1.PushStatus.FAILED;
                item.lastError = results.map((r) => r.error).join('; ');
            }
            else {
                item.status = push_outbox_entity_1.PushStatus.SENT;
                item.sentAt = new Date();
            }
            item.attemptCount++;
            await this.outboxRepo.save(item);
        }
        catch (error) {
            this.logger.error(`Failed to process item ${item.id}`, error);
            item.status = push_outbox_entity_1.PushStatus.FAILED;
            item.lastError = error.message;
            item.attemptCount++;
            await this.outboxRepo.save(item);
        }
    }
    async sendToToken(token, item) {
        let result;
        if (token.provider === 'APNS') {
            result = await this.apnsSender.send({
                deviceToken: token.token,
                title: item.title,
                body: item.body,
                data: item.data,
                environment: token.apnsEnvironment || 'production',
            });
        }
        else {
            result = await this.fcmSender.send({
                token: token.token,
                title: item.title,
                body: item.body,
                data: item.data,
            });
        }
        if (result.invalidToken) {
            this.logger.warn(`Invalid token for user ${token.userId}, disabling...`);
            token.disabledAt = new Date();
            await this.tokenRepo.save(token);
        }
        return result;
    }
};
exports.PushWorker = PushWorker;
exports.PushWorker = PushWorker = PushWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(push_outbox_entity_1.PushOutbox)),
    __param(1, (0, typeorm_1.InjectRepository)(push_token_entity_1.PushToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        apns_sender_1.ApnsSender,
        fcm_sender_1.FcmSender])
], PushWorker);
//# sourceMappingURL=push.worker.js.map