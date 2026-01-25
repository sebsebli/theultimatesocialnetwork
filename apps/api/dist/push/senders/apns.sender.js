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
var ApnsSender_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApnsSender = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const http2 = __importStar(require("http2"));
const jwt = __importStar(require("jsonwebtoken"));
const fs = __importStar(require("fs"));
let ApnsSender = ApnsSender_1 = class ApnsSender {
    configService;
    logger = new common_1.Logger(ApnsSender_1.name);
    session = null;
    token = null;
    tokenGeneratedAt = 0;
    constructor(configService) {
        this.configService = configService;
    }
    getAuthToken() {
        const now = Math.floor(Date.now() / 1000);
        if (this.token && now - this.tokenGeneratedAt < 3000) {
            return this.token;
        }
        const keyId = this.configService.get('APNS_KEY_ID');
        const teamId = this.configService.get('APNS_TEAM_ID');
        const p8Path = this.configService.get('APNS_P8_PATH');
        if (!keyId || !teamId || !p8Path) {
            throw new Error('Missing APNs configuration');
        }
        try {
            const privateKey = fs.readFileSync(p8Path, 'utf8');
            this.token = jwt.sign({
                iss: teamId,
                iat: now,
            }, privateKey, {
                algorithm: 'ES256',
                header: {
                    alg: 'ES256',
                    kid: keyId,
                },
            });
            this.tokenGeneratedAt = now;
            return this.token;
        }
        catch (error) {
            this.logger.error('Failed to generate APNs token', error);
            throw error;
        }
    }
    getSession(isProduction) {
        const host = isProduction
            ? 'https://api.push.apple.com'
            : 'https://api.sandbox.push.apple.com';
        if (!this.session || this.session.destroyed || this.session.closed) {
            this.session = http2.connect(host);
            this.session.on('error', (err) => {
                this.logger.error('APNs session error', err);
                this.session = null;
            });
        }
        return this.session;
    }
    async send(args) {
        const { deviceToken, title, body, data, environment } = args;
        const bundleId = this.configService.get('APNS_BUNDLE_ID');
        if (!bundleId) {
            this.logger.error('APNs Bundle ID not configured');
            return { ok: false, error: 'Configuration Error' };
        }
        try {
            const token = this.getAuthToken();
            const session = this.getSession(environment === 'production');
            const payload = {
                aps: {
                    alert: {
                        title,
                        body,
                    },
                    sound: 'default',
                },
                ...data,
            };
            return new Promise((resolve) => {
                const req = session.request({
                    ':method': 'POST',
                    ':path': `/3/device/${deviceToken}`,
                    'authorization': `bearer ${token}`,
                    'apns-topic': bundleId,
                    'apns-push-type': 'alert',
                    'apns-priority': '10',
                });
                let data = '';
                req.on('data', (chunk) => (data += chunk));
                req.on('response', (headers) => {
                    const status = headers[':status'];
                    if (status === 200) {
                        resolve({ ok: true });
                    }
                    else {
                        const responseBody = data ? JSON.parse(data) : {};
                        const reason = responseBody.reason;
                        this.logger.warn(`APNs error: ${status} ${reason}`);
                        if (status === 410 || reason === 'BadDeviceToken' || reason === 'Unregistered') {
                            resolve({ ok: false, invalidToken: true, error: reason });
                        }
                        else {
                            resolve({ ok: false, error: reason || `Status ${status}` });
                        }
                    }
                });
                req.on('error', (err) => {
                    this.logger.error('APNs request error', err);
                    resolve({ ok: false, error: err.message });
                });
                req.end(JSON.stringify(payload));
            });
        }
        catch (error) {
            this.logger.error('Failed to send APNs notification', error);
            return { ok: false, error: error.message };
        }
    }
};
exports.ApnsSender = ApnsSender;
exports.ApnsSender = ApnsSender = ApnsSender_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ApnsSender);
//# sourceMappingURL=apns.sender.js.map