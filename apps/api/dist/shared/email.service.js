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
var EmailService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    transporter = null;
    constructor(configService) {
        this.configService = configService;
        this.initializeTransporter();
    }
    initializeTransporter() {
        const host = this.configService.get('SMTP_HOST');
        const port = this.configService.get('SMTP_PORT') || '587';
        const secure = this.configService.get('SMTP_SECURE') === 'true';
        const user = this.configService.get('SMTP_USER');
        const pass = this.configService.get('SMTP_PASS');
        if (!host || !user || !pass) {
            this.logger.warn('SMTP not configured. Email sending will be disabled.');
            this.logger.warn('Set SMTP_HOST, SMTP_USER, and SMTP_PASS to enable email.');
            return;
        }
        this.transporter = nodemailer.createTransport({
            host: host,
            port: parseInt(port),
            secure: secure,
            auth: {
                user: user,
                pass: pass,
            },
        });
        this.logger.log(`Email service initialized with ${host}:${port}`);
    }
    async sendMagicLink(email, token, baseUrl) {
        if (!this.transporter) {
            const verifyUrl = baseUrl
                ? `${baseUrl}/verify?email=${encodeURIComponent(email)}&token=${token}`
                : `http://localhost:3001/verify?email=${encodeURIComponent(email)}&token=${token}`;
            this.logger.warn(`[MOCK EMAIL] Magic link for ${email}: ${verifyUrl}`);
            return false;
        }
        const verifyUrl = baseUrl
            ? `${baseUrl}/verify?email=${encodeURIComponent(email)}&token=${token}`
            : this.configService.get('FRONTEND_URL') || `http://localhost:3001/verify?email=${encodeURIComponent(email)}&token=${token}`;
        try {
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_FROM') || '"Cite System" <noreply@cite.com>',
                to: email,
                subject: 'Your Magic Link - Cite System',
                html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Cite System</h1>
              </div>
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
                <h2 style="color: #333; margin-top: 0;">Sign in to your account</h2>
                <p style="color: #666; font-size: 16px;">Click the button below to sign in to your Cite System account. This link will expire in 15 minutes.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verifyUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Sign In</a>
                </div>
                <p style="color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${verifyUrl}" style="color: #667eea; word-break: break-all;">${verifyUrl}</a>
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                  If you didn't request this link, you can safely ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
                text: `
Sign in to your Cite System account

Click the link below to sign in. This link will expire in 15 minutes.

${verifyUrl}

If you didn't request this link, you can safely ignore this email.
        `.trim(),
            });
            this.logger.log(`Magic link email sent to ${email}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send magic link email to ${email}:`, error);
            throw error;
        }
    }
    async sendEmail(to, subject, html, text, attachments) {
        if (!this.transporter) {
            this.logger.warn(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
            return false;
        }
        try {
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_FROM') || '"Cite System" <noreply@cite.com>',
                to: to,
                subject: subject,
                html: html,
                text: text || html.replace(/<[^>]*>/g, ''),
                attachments: attachments,
            });
            this.logger.log(`Email sent to ${to}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
            throw error;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], EmailService);
//# sourceMappingURL=email.service.js.map