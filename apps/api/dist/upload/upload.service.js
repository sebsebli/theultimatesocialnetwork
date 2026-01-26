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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const MinIO = __importStar(require("minio"));
const sharp_1 = __importDefault(require("sharp"));
const blurhash_1 = require("blurhash");
const uuid_1 = require("uuid");
const safety_service_1 = require("../safety/safety.service");
let UploadService = class UploadService {
    configService;
    safetyService;
    minioClient;
    bucketName;
    constructor(configService, safetyService) {
        this.configService = configService;
        this.safetyService = safetyService;
        this.minioClient = new MinIO.Client({
            endPoint: this.configService.get('MINIO_ENDPOINT') || 'localhost',
            port: parseInt(this.configService.get('MINIO_PORT') || '9000'),
            useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
            accessKey: this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
            secretKey: this.configService.get('MINIO_SECRET_KEY') || 'minioadmin',
        });
        this.bucketName = this.configService.get('MINIO_BUCKET') || 'cite-images';
    }
    async uploadHeaderImage(file) {
        return this.processAndUpload(file, { width: 1600, height: null, fit: 'inside' }, true);
    }
    async uploadProfilePicture(file) {
        const result = await this.processAndUpload(file, { width: 400, height: 400, fit: 'cover' }, false);
        return result.key;
    }
    async processAndUpload(file, resizeOptions, generateBlurhash) {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|webp|png)$/)) {
            throw new common_1.BadRequestException('Only JPG, WEBP, and PNG images are allowed');
        }
        if (file.size > 10 * 1024 * 1024) {
            throw new common_1.BadRequestException('File size must be less than 10MB');
        }
        const safety = await this.safetyService.checkImage(file.buffer);
        if (!safety.safe) {
            throw new common_1.BadRequestException(safety.reason || 'Image failed safety check');
        }
        const image = (0, sharp_1.default)(file.buffer);
        let blurhashStr;
        if (generateBlurhash) {
            const { data, info } = await image
                .clone()
                .raw()
                .ensureAlpha()
                .resize(32, 32, { fit: 'inside' })
                .toBuffer({ resolveWithObject: true });
            blurhashStr = (0, blurhash_1.encode)(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
        }
        const processedImage = await image
            .resize(resizeOptions.width, resizeOptions.height, {
            withoutEnlargement: true,
            fit: resizeOptions.fit,
        })
            .webp({ quality: 85 })
            .toBuffer();
        const key = `uploads/${(0, uuid_1.v4)()}.webp`;
        await this.minioClient.putObject(this.bucketName, key, processedImage, processedImage.length, {
            'Content-Type': 'image/webp',
        });
        return { key, blurhash: blurhashStr };
    }
    async getImageUrl(key) {
        const publicUrl = this.configService.get('MINIO_PUBLIC_URL') || 'http://localhost:9000';
        const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
        return `${baseUrl}/${this.bucketName}/${key}`;
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        safety_service_1.SafetyService])
], UploadService);
//# sourceMappingURL=upload.service.js.map