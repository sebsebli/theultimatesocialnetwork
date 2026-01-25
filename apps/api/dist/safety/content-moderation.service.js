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
exports.ContentModerationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const natural_1 = require("natural");
const post_entity_1 = require("../entities/post.entity");
const reply_entity_1 = require("../entities/reply.entity");
let ContentModerationService = class ContentModerationService {
    postRepo;
    replyRepo;
    bayesianClassifier;
    isGemmaAvailable = false;
    constructor(postRepo, replyRepo) {
        this.postRepo = postRepo;
        this.replyRepo = replyRepo;
        this.bayesianClassifier = new natural_1.BayesClassifier();
    }
    async onModuleInit() {
        await this.trainBayesianClassifier();
        await this.checkGemmaAvailability();
    }
    async trainBayesianClassifier() {
        const spamExamples = [
            'buy now click here',
            'free money guaranteed',
            'click this link now',
            'limited time offer',
            'act now before its too late',
            'you have won a prize',
            'congratulations you are selected',
        ];
        const nonSpamExamples = [
            'this is a great article about technology',
            'i enjoyed reading your post',
            'thanks for sharing your thoughts',
            'what do you think about this topic',
            'i agree with your perspective',
            'this is interesting information',
            'can you explain more about this',
        ];
        for (const spam of spamExamples) {
            this.bayesianClassifier.addDocument(spam, 'spam');
        }
        for (const nonSpam of nonSpamExamples) {
            this.bayesianClassifier.addDocument(nonSpam, 'non-spam');
        }
        this.bayesianClassifier.train();
    }
    async checkGemmaAvailability() {
        try {
            const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
            const response = await fetch(`${ollamaHost}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000),
            });
            if (response.ok) {
                const data = await response.json();
                const hasGemma = data.models?.some((m) => m.name?.includes('gemma3') ||
                    m.name?.includes('gemma2') ||
                    m.name?.includes('gemma'));
                this.isGemmaAvailable = hasGemma || false;
                if (this.isGemmaAvailable) {
                    console.log('✅ Gemma model available for content moderation');
                }
                else {
                    console.log('⚠️ Gemma model not found, using fallback moderation');
                }
            }
        }
        catch (error) {
            this.isGemmaAvailable = false;
            console.warn('⚠️ Ollama not available, using fallback moderation:', error.message);
        }
    }
    async checkRepeatedContent(text, userId, contentType) {
        const normalizedText = text.toLowerCase().trim().replace(/\s+/g, ' ');
        const posts = await this.postRepo.find({
            where: { authorId: userId },
            select: ['body'],
            take: 50,
        });
        const replies = await this.replyRepo.find({
            where: { authorId: userId },
            select: ['body'],
            take: 50,
        });
        let count = 0;
        const similarityThreshold = 0.9;
        for (const post of posts) {
            const normalizedPost = post.body.toLowerCase().trim().replace(/\s+/g, ' ');
            const similarity = this.calculateSimilarity(normalizedText, normalizedPost);
            if (similarity >= similarityThreshold) {
                count++;
            }
        }
        for (const reply of replies) {
            const normalizedReply = reply.body.toLowerCase().trim().replace(/\s+/g, ' ');
            const similarity = this.calculateSimilarity(normalizedText, normalizedReply);
            if (similarity >= similarityThreshold) {
                count++;
            }
        }
        return {
            isRepeated: count >= 2,
            count,
        };
    }
    calculateSimilarity(str1, str2) {
        if (str1 === str2)
            return 1.0;
        const words1 = new Set(str1.split(' '));
        const words2 = new Set(str2.split(' '));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }
    async stage1BayesianFilter(text, userId, contentType) {
        const repeated = await this.checkRepeatedContent(text, userId, contentType);
        if (repeated.isRepeated) {
            return {
                safe: false,
                reason: `Repeated content detected. This content has been posted ${repeated.count} times.`,
                confidence: 0.95,
                needsStage2: false,
            };
        }
        const classifications = this.bayesianClassifier.getClassifications(text);
        const spamClassification = classifications.find(c => c.label === 'spam');
        const nonSpamClassification = classifications.find(c => c.label === 'non-spam');
        const spamScore = spamClassification?.value || 0;
        const nonSpamScore = nonSpamClassification?.value || 0;
        const totalScore = spamScore + nonSpamScore;
        if (totalScore === 0) {
            return { safe: true, confidence: 0.5, needsStage2: true };
        }
        const spamConfidence = spamScore / totalScore;
        if (spamConfidence > 0.9) {
            return {
                safe: false,
                reason: 'Content flagged as spam by automated filter.',
                confidence: spamConfidence,
                needsStage2: false,
            };
        }
        if (spamConfidence < 0.1) {
            return {
                safe: true,
                confidence: 1 - spamConfidence,
                needsStage2: false,
            };
        }
        return {
            safe: true,
            confidence: 1 - spamConfidence,
            needsStage2: true,
        };
    }
    async stage2GemmaAnalysis(text) {
        if (!this.isGemmaAvailable) {
            return this.fallbackContentAnalysis(text);
        }
        try {
            const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
            const response = await fetch(`${ollamaHost}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemma3:270m',
                    prompt: `Analyze this content for safety. Check for: violence, harassment, hate speech, threats, or harmful content. Respond with JSON: {"safe": true/false, "reason": "explanation", "confidence": 0.0-1.0}\n\nContent: "${text.substring(0, 500)}"`,
                    stream: false,
                    options: {
                        temperature: 0.1,
                    },
                }),
                signal: AbortSignal.timeout(5000),
            });
            if (response.ok) {
                const data = await response.json();
                const responseText = data.response || '';
                try {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const analysis = JSON.parse(jsonMatch[0]);
                        return {
                            safe: analysis.safe !== false,
                            reason: analysis.reason,
                            confidence: analysis.confidence || 0.7,
                        };
                    }
                }
                catch (e) {
                }
                const unsafeIndicators = ['unsafe', 'violence', 'harassment', 'hate', 'threat'];
                const isUnsafe = unsafeIndicators.some(indicator => responseText.toLowerCase().includes(indicator));
                return {
                    safe: !isUnsafe,
                    reason: isUnsafe ? 'Content flagged by AI safety analysis.' : undefined,
                    confidence: 0.7,
                };
            }
        }
        catch (error) {
        }
        return this.fallbackContentAnalysis(text);
    }
    fallbackContentAnalysis(text) {
        const lower = text.toLowerCase();
        const violenceKeywords = ['kill', 'murder', 'violence', 'attack', 'harm', 'hurt'];
        const harassmentKeywords = ['harass', 'bully', 'threaten', 'intimidate'];
        const hateKeywords = ['hate', 'racist', 'discriminate', 'slur'];
        const hasViolence = violenceKeywords.some(kw => lower.includes(kw));
        const hasHarassment = harassmentKeywords.some(kw => lower.includes(kw));
        const hasHate = hateKeywords.some(kw => lower.includes(kw));
        if (hasViolence || hasHarassment || hasHate) {
            const reasons = [];
            if (hasViolence)
                reasons.push('violence');
            if (hasHarassment)
                reasons.push('harassment');
            if (hasHate)
                reasons.push('hate speech');
            return {
                safe: false,
                reason: `Content contains ${reasons.join(', ')}.`,
                confidence: 0.7,
            };
        }
        return { safe: true, confidence: 0.6 };
    }
    async checkContent(text, userId, contentType = 'post') {
        const stage1Result = await this.stage1BayesianFilter(text, userId, contentType);
        if (!stage1Result.needsStage2) {
            return {
                safe: stage1Result.safe,
                reason: stage1Result.reason,
                confidence: stage1Result.confidence,
            };
        }
        const stage2Result = await this.stage2GemmaAnalysis(text);
        if (!stage2Result.safe) {
            return {
                safe: false,
                reason: stage2Result.reason || 'Content flagged by AI safety analysis.',
                confidence: stage2Result.confidence,
            };
        }
        return {
            safe: true,
            confidence: (stage1Result.confidence + stage2Result.confidence) / 2,
        };
    }
    async checkImage(buffer) {
        if (buffer.length < 100) {
            return { safe: false, reason: 'Image file corrupted or invalid.', confidence: 1.0 };
        }
        if (this.isGemmaAvailable) {
            return this.stage2GemmaImageAnalysis(buffer);
        }
        return this.fallbackImageAnalysis(buffer);
    }
    async stage2GemmaImageAnalysis(buffer) {
        try {
            const base64Image = buffer.toString('base64');
            let mimeType = 'image/jpeg';
            if (buffer[0] === 0x89 && buffer[1] === 0x50)
                mimeType = 'image/png';
            if (buffer[0] === 0x52 && buffer[1] === 0x49)
                mimeType = 'image/webp';
            const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
            const response = await fetch(`${ollamaHost}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemma3:270m',
                    prompt: `Analyze this image for appropriateness. Check for: nudity, violence, explicit content, inappropriate material. Respond with JSON only: {"safe": true/false, "reason": "explanation", "confidence": 0.0-1.0}`,
                    images: [base64Image],
                    stream: false,
                    options: {
                        temperature: 0.1,
                    },
                }),
                signal: AbortSignal.timeout(10000),
            });
            if (response.ok) {
                const data = await response.json();
                const responseText = data.response || '';
                try {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const analysis = JSON.parse(jsonMatch[0]);
                        return {
                            safe: analysis.safe !== false,
                            reason: analysis.reason,
                            confidence: analysis.confidence || 0.7,
                        };
                    }
                }
                catch (e) {
                }
                const unsafeIndicators = ['unsafe', 'inappropriate', 'nudity', 'violence', 'explicit'];
                const isUnsafe = unsafeIndicators.some(indicator => responseText.toLowerCase().includes(indicator));
                return {
                    safe: !isUnsafe,
                    reason: isUnsafe ? 'Image flagged by AI safety analysis.' : undefined,
                    confidence: 0.7,
                };
            }
        }
        catch (error) {
            console.warn('Gemma image analysis failed, using fallback:', error.message);
        }
        return this.fallbackImageAnalysis(buffer);
    }
    fallbackImageAnalysis(buffer) {
        if (buffer.length < 100) {
            return { safe: false, reason: 'Image file too small or corrupted.', confidence: 1.0 };
        }
        const isValidImage = (buffer[0] === 0xFF && buffer[1] === 0xD8) ||
            (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) ||
            (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46);
        if (!isValidImage) {
            return { safe: false, reason: 'Invalid image format.', confidence: 1.0 };
        }
        return { safe: true, confidence: 0.5 };
    }
};
exports.ContentModerationService = ContentModerationService;
exports.ContentModerationService = ContentModerationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(reply_entity_1.Reply)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ContentModerationService);
//# sourceMappingURL=content-moderation.service.js.map