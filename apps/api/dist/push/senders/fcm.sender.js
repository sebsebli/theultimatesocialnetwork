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
var FcmSender_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FcmSender = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const admin = __importStar(require("firebase-admin"));
let FcmSender = FcmSender_1 = class FcmSender {
    configService;
    logger = new common_1.Logger(FcmSender_1.name);
    initialized = false;
    constructor(configService) {
        this.configService = configService;
        this.initialize();
    }
    initialize() {
        const serviceAccountPath = this.configService.get('FCM_SERVICE_ACCOUNT_JSON');
        if (!serviceAccountPath) {
            this.logger.warn('FCM_SERVICE_ACCOUNT_JSON not set, FCM will not work');
            return;
        }
        try {
            if (!admin.apps.length) {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                this.initialized = true;
                this.logger.log('FCM initialized successfully');
            }
            else {
                this.initialized = true;
            }
        }
        catch (error) {
            this.logger.error('Failed to initialize FCM', error);
        }
    }
    async send(args) {
        if (!this.initialized) {
            return { ok: false, error: 'FCM not initialized' };
        }
        try {
            const message = {
                token: args.token,
                notification: {
                    title: args.title,
                    body: args.body,
                },
                data: args.data,
            };
            await admin.messaging().send(message);
            return { ok: true };
        }
        catch (error) {
            this.logger.error('FCM send error', error);
            const errorCode = error.code;
            if (errorCode === 'messaging/registration-token-not-registered' ||
                errorCode === 'messaging/invalid-argument') {
                return { ok: false, invalidToken: true, error: errorCode };
            }
            return { ok: false, error: error.message };
        }
    }
};
exports.FcmSender = FcmSender;
exports.FcmSender = FcmSender = FcmSender_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], FcmSender);
//# sourceMappingURL=fcm.sender.js.map