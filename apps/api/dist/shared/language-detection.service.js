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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageDetectionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("../entities/post.entity");
const user_entity_1 = require("../entities/user.entity");
let LanguageDetectionService = class LanguageDetectionService {
    postRepo;
    userRepo;
    constructor(postRepo, userRepo) {
        this.postRepo = postRepo;
        this.userRepo = userRepo;
    }
    async getUserMostCommonLanguage(userId) {
        const posts = await this.postRepo.find({
            where: { authorId: userId },
            select: ['lang'],
            take: 100,
        });
        if (posts.length === 0) {
            return null;
        }
        const langCounts = {};
        for (const post of posts) {
            if (post.lang) {
                langCounts[post.lang] = (langCounts[post.lang] || 0) + 1;
            }
        }
        let mostCommonLang = null;
        let maxCount = 0;
        for (const [lang, count] of Object.entries(langCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonLang = lang;
            }
        }
        return mostCommonLang;
    }
    async detectLanguage(text, userId, userLanguages) {
        const cleanText = text
            .replace(/\[\[.*?\]\]/g, '')
            .replace(/\[.*?\]\(.*?\)/g, '')
            .replace(/https?:\/\/[^\s]+/g, '')
            .replace(/#+\s*/g, '')
            .replace(/\*\*.*?\*\*/g, '')
            .replace(/_.*?_/g, '')
            .trim();
        if (cleanText.length < 10) {
            if (userLanguages && userLanguages.length > 0) {
                return { lang: userLanguages[0], confidence: 0.4 };
            }
            return { lang: 'en', confidence: 0.3 };
        }
        const { franc } = await import('franc');
        const detectedLang = franc(cleanText, { minLength: 3 });
        const langMap = {
            'eng': 'en', 'deu': 'de', 'fra': 'fr', 'spa': 'es', 'ita': 'it',
            'por': 'pt', 'nld': 'nl', 'fin': 'fi', 'swe': 'sv', 'nor': 'no',
            'dan': 'da', 'pol': 'pl', 'rus': 'ru', 'jpn': 'ja', 'kor': 'ko',
            'zho': 'zh', 'ara': 'ar', 'heb': 'he', 'tur': 'tr', 'ces': 'cs',
            'hun': 'hu', 'ron': 'ro', 'bul': 'bg', 'hrv': 'hr', 'srp': 'sr',
            'slk': 'sk', 'slv': 'sl', 'est': 'et', 'lav': 'lv', 'lit': 'lt',
            'gre': 'el', 'tha': 'th', 'vie': 'vi', 'ind': 'id', 'msa': 'ms',
        };
        const lang = langMap[detectedLang] || detectedLang || 'en';
        const baseConfidence = Math.min(0.95, Math.max(0.5, cleanText.length / 200));
        if (baseConfidence < 0.6) {
            if (userLanguages && userLanguages.length > 0) {
                if (userLanguages.includes(lang)) {
                    return { lang, confidence: Math.min(0.8, baseConfidence + 0.2) };
                }
                return { lang: userLanguages[0], confidence: 0.5 };
            }
            if (userId) {
                const commonLang = await this.getUserMostCommonLanguage(userId);
                if (commonLang) {
                    return { lang: commonLang, confidence: 0.5 };
                }
            }
        }
        return { lang, confidence: baseConfidence };
    }
};
exports.LanguageDetectionService = LanguageDetectionService;
exports.LanguageDetectionService = LanguageDetectionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], LanguageDetectionService);
//# sourceMappingURL=language-detection.service.js.map