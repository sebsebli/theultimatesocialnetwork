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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("../entities/post.entity");
const user_entity_1 = require("../entities/user.entity");
const post_topic_entity_1 = require("../entities/post-topic.entity");
const follow_entity_1 = require("../entities/follow.entity");
const like_entity_1 = require("../entities/like.entity");
const keep_entity_1 = require("../entities/keep.entity");
let RecommendationService = class RecommendationService {
    postRepo;
    userRepo;
    postTopicRepo;
    followRepo;
    likeRepo;
    keepRepo;
    embeddingModel = null;
    isModelLoaded = false;
    constructor(postRepo, userRepo, postTopicRepo, followRepo, likeRepo, keepRepo) {
        this.postRepo = postRepo;
        this.userRepo = userRepo;
        this.postTopicRepo = postTopicRepo;
        this.followRepo = followRepo;
        this.likeRepo = likeRepo;
        this.keepRepo = keepRepo;
    }
    async onModuleInit() {
        this.loadEmbeddingModel().catch(err => {
            console.warn('Failed to load embedding model, recommendations will use fallback:', err.message);
        });
    }
    async loadEmbeddingModel() {
        try {
            const { pipeline } = await import('@xenova/transformers');
            this.embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            this.isModelLoaded = true;
            console.log('✅ Embedding model loaded for recommendations');
        }
        catch (error) {
            console.warn('Could not load embedding model:', error);
            this.isModelLoaded = false;
        }
    }
    async generateEmbedding(text) {
        if (!this.isModelLoaded || !this.embeddingModel) {
            return null;
        }
        try {
            const cleanText = text
                .replace(/\[\[.*?\]\]/g, '')
                .replace(/\[.*?\]\(.*?\)/g, '')
                .replace(/https?:\/\/[^\s]+/g, '')
                .replace(/#+\s*/g, '')
                .trim()
                .substring(0, 512);
            const output = await this.embeddingModel(cleanText, {
                pooling: 'mean',
                normalize: true,
            });
            return Array.from(output.data);
        }
        catch (error) {
            console.error('Error generating embedding:', error);
            return null;
        }
    }
    cosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length)
            return 0;
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }
    async getUserInterestProfile(userId) {
        const userPosts = await this.postRepo.find({
            where: { authorId: userId },
            take: 50,
        });
        const topics = new Set();
        for (const post of userPosts) {
            const postTopics = await this.postTopicRepo.find({
                where: { postId: post.id },
            });
            for (const pt of postTopics) {
                topics.add(pt.topicId);
            }
        }
        const likes = await this.likeRepo.find({
            where: { userId },
            take: 50,
        });
        const likedPostIds = likes.map(l => l.postId);
        const likedPosts = likedPostIds.length > 0
            ? await this.postRepo.find({
                where: { id: (0, typeorm_2.In)(likedPostIds) },
                relations: ['author'],
            })
            : [];
        const keeps = await this.keepRepo.find({
            where: { userId },
            take: 50,
        });
        const keptPostIds = keeps.map(k => k.postId);
        const keptPosts = keptPostIds.length > 0
            ? await this.postRepo.find({
                where: { id: (0, typeorm_2.In)(keptPostIds) },
                relations: ['author'],
            })
            : [];
        const follows = await this.followRepo.find({
            where: { followerId: userId },
        });
        const followedUsers = follows.map(f => f.followeeId);
        return {
            topics: Array.from(topics),
            likedPosts,
            keptPosts,
            followedUsers,
        };
    }
    async getRecommendedPosts(userId, limit = 20) {
        const userProfile = await this.getUserInterestProfile(userId);
        if (userProfile.likedPosts.length === 0 && userProfile.keptPosts.length === 0) {
            return this.getTrendingPosts(limit);
        }
        const interestTexts = userProfile.likedPosts
            .concat(userProfile.keptPosts)
            .map(p => `${p.title || ''} ${p.body}`.trim())
            .slice(0, 10);
        if (interestTexts.length === 0 || !this.isModelLoaded) {
            return this.getFallbackRecommendations(userId, userProfile.followedUsers, limit);
        }
        const embeddings = await Promise.all(interestTexts.map(text => this.generateEmbedding(text)));
        const validEmbeddings = embeddings.filter(e => e !== null);
        if (validEmbeddings.length === 0) {
            return this.getFallbackRecommendations(userId, userProfile.followedUsers, limit);
        }
        const avgEmbedding = new Array(validEmbeddings[0].length).fill(0);
        for (const emb of validEmbeddings) {
            for (let i = 0; i < emb.length; i++) {
                avgEmbedding[i] += emb[i];
            }
        }
        for (let i = 0; i < avgEmbedding.length; i++) {
            avgEmbedding[i] /= validEmbeddings.length;
        }
        const candidatePosts = await this.postRepo
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.author_id != :userId', { userId })
            .andWhere('post.visibility = :visibility', { visibility: 'PUBLIC' })
            .andWhere('post.deleted_at IS NULL')
            .orderBy('post.created_at', 'DESC')
            .take(200)
            .getMany();
        const scoredPosts = await Promise.all(candidatePosts.map(async (post) => {
            const postText = `${post.title || ''} ${post.body}`.trim();
            const postEmbedding = await this.generateEmbedding(postText);
            if (!postEmbedding) {
                return { post, score: 0 };
            }
            const similarity = this.cosineSimilarity(avgEmbedding, postEmbedding);
            const followBoost = userProfile.followedUsers.includes(post.authorId) ? 0.2 : 0;
            const postTopics = await this.postTopicRepo.find({
                where: { postId: post.id },
            });
            const topicBoost = postTopics.some(pt => userProfile.topics.includes(pt.topicId)) ? 0.1 : 0;
            return {
                post,
                score: similarity + followBoost + topicBoost,
            };
        }));
        scoredPosts.sort((a, b) => b.score - a.score);
        return scoredPosts.slice(0, limit).map(sp => sp.post);
    }
    async getTrendingPosts(limit) {
        return this.postRepo
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.visibility = :visibility', { visibility: 'PUBLIC' })
            .andWhere('post.deleted_at IS NULL')
            .orderBy('post.quote_count', 'DESC')
            .addOrderBy('post.created_at', 'DESC')
            .take(limit)
            .getMany();
    }
    async getFallbackRecommendations(userId, followedUsers, limit) {
        if (followedUsers.length > 0) {
            const followedPosts = await this.postRepo
                .createQueryBuilder('post')
                .leftJoinAndSelect('post.author', 'author')
                .where('post.author_id IN (:...userIds)', { userIds: followedUsers })
                .andWhere('post.visibility = :visibility', { visibility: 'PUBLIC' })
                .andWhere('post.deleted_at IS NULL')
                .orderBy('post.created_at', 'DESC')
                .take(limit)
                .getMany();
            if (followedPosts.length >= limit) {
                return followedPosts;
            }
            const remaining = limit - followedPosts.length;
            const trending = await this.getTrendingPosts(remaining);
            return followedPosts.concat(trending);
        }
        return this.getTrendingPosts(limit);
    }
    async getRecommendedPeople(userId, limit = 20) {
        const userProfile = await this.getUserInterestProfile(userId);
        const similarUsers = await this.postTopicRepo
            .createQueryBuilder('pt')
            .innerJoin('posts', 'p', 'p.id = pt.post_id')
            .where('pt.topic_id IN (:...topics)', { topics: userProfile.topics })
            .andWhere('p.author_id != :userId', { userId })
            .andWhere('p.deleted_at IS NULL')
            .select('p.author_id', 'authorId')
            .addSelect('COUNT(*)', 'topicOverlap')
            .groupBy('p.author_id')
            .orderBy('topicOverlap', 'DESC')
            .limit(limit * 2)
            .getRawMany();
        const candidateUserIds = similarUsers.map(su => su.authorId);
        if (candidateUserIds.length === 0) {
            return this.userRepo
                .createQueryBuilder('user')
                .where('user.id != :userId', { userId })
                .orderBy('user.follower_count', 'DESC')
                .take(limit)
                .getMany();
        }
        const users = await this.userRepo.find({
            where: { id: (0, typeorm_2.In)(candidateUserIds) },
        });
        const userMap = new Map(users.map(u => [u.id, u]));
        const sortedUsers = similarUsers
            .map(su => userMap.get(su.authorId))
            .filter(u => u !== undefined)
            .slice(0, limit);
        return sortedUsers;
    }
};
exports.RecommendationService = RecommendationService;
exports.RecommendationService = RecommendationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(post_topic_entity_1.PostTopic)),
    __param(3, (0, typeorm_1.InjectRepository)(follow_entity_1.Follow)),
    __param(4, (0, typeorm_1.InjectRepository)(like_entity_1.Like)),
    __param(5, (0, typeorm_1.InjectRepository)(keep_entity_1.Keep)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object, typeof (_d = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _d : Object, typeof (_e = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _e : Object, typeof (_f = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _f : Object])
], RecommendationService);
//# sourceMappingURL=recommendation.service.js.map