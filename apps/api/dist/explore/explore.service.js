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
exports.ExploreService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const topic_entity_1 = require("../entities/topic.entity");
const user_entity_1 = require("../entities/user.entity");
const post_entity_1 = require("../entities/post.entity");
const post_edge_entity_1 = require("../entities/post-edge.entity");
const follow_entity_1 = require("../entities/follow.entity");
const external_source_entity_1 = require("../entities/external-source.entity");
const neo4j_service_1 = require("../database/neo4j.service");
let ExploreService = class ExploreService {
    topicRepo;
    userRepo;
    postRepo;
    postEdgeRepo;
    followRepo;
    externalSourceRepo;
    dataSource;
    neo4jService;
    constructor(topicRepo, userRepo, postRepo, postEdgeRepo, followRepo, externalSourceRepo, dataSource, neo4jService) {
        this.topicRepo = topicRepo;
        this.userRepo = userRepo;
        this.postRepo = postRepo;
        this.postEdgeRepo = postEdgeRepo;
        this.followRepo = followRepo;
        this.externalSourceRepo = externalSourceRepo;
        this.dataSource = dataSource;
        this.neo4jService = neo4jService;
    }
    async getTopics(filter) {
        const topics = await this.topicRepo.find({
            take: 20,
            order: { createdAt: 'DESC' },
        });
        return topics.map(t => ({
            ...t,
            reasons: ['Topic overlap', 'Cited today'],
        }));
    }
    async getPeople(userId, filter) {
        if (userId) {
        }
        const users = await this.userRepo.find({
            take: 20,
            order: { followerCount: 'DESC' },
        });
        return users.map(u => ({
            ...u,
            reasons: ['Topic overlap', 'Frequently quoted'],
        }));
    }
    async getQuotedNow(userId, limit = 20, filter) {
        const now = new Date();
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const scoredIds = await this.postEdgeRepo
            .createQueryBuilder('edge')
            .select('edge.to_post_id', 'postId')
            .addSelect(`
        SUM(
          CASE 
            WHEN edge.created_at >= :sixHoursAgo THEN 1.0 
            ELSE 0.3 
          END
        )`, 'score')
            .where('edge.edge_type = :type', { type: post_edge_entity_1.EdgeType.QUOTE })
            .andWhere('edge.created_at >= :twentyFourHoursAgo', { twentyFourHoursAgo })
            .setParameters({ sixHoursAgo, twentyFourHoursAgo })
            .groupBy('edge.to_post_id')
            .orderBy('score', 'DESC')
            .limit(limit)
            .getRawMany();
        if (scoredIds.length === 0) {
            return [];
        }
        const topPostIds = scoredIds.map(s => s.postId);
        const query = this.postRepo
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.id IN (:...ids)', { ids: topPostIds })
            .andWhere('post.deleted_at IS NULL');
        if (filter?.lang && filter.lang !== 'all') {
            query.andWhere('post.lang = :lang', { lang: filter.lang });
        }
        const posts = await query
            .orderBy(`CASE post.id ${topPostIds.map((id, idx) => `WHEN '${id}' THEN ${idx}`).join(' ')} END`)
            .getMany();
        return posts.map(p => ({
            ...p,
            reasons: ['Cited today', 'High quote velocity'],
        }));
    }
    async getTopicStartHere(topicId, limit = 10) {
        const posts = await this.postRepo
            .createQueryBuilder('post')
            .leftJoin('post_topics', 'pt', 'pt.post_id = post.id')
            .where('pt.topic_id = :topicId', { topicId })
            .andWhere('post.deleted_at IS NULL')
            .leftJoinAndSelect('post.author', 'author')
            .getMany();
        const postIds = posts.map(p => p.id);
        const backlinks = await this.postEdgeRepo
            .createQueryBuilder('edge')
            .select('edge.to_post_id', 'postId')
            .addSelect('COUNT(*)', 'count')
            .where('edge.to_post_id IN (:...ids)', { ids: postIds })
            .andWhere('edge.edge_type = :type', { type: post_edge_entity_1.EdgeType.LINK })
            .groupBy('edge.to_post_id')
            .getRawMany();
        const backlinkMap = new Map(backlinks.map(b => [b.postId, parseInt(b.count)]));
        const scored = posts.map(post => ({
            post,
            score: (post.quoteCount || 0) * 1.0 +
                (backlinkMap.get(post.id) || 0) * 0.2 +
                (post.replyCount || 0) * 0.1,
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit).map(s => s.post);
    }
    async getDeepDives(userId, limit = 20, filter) {
        const rankedIds = await this.postEdgeRepo
            .createQueryBuilder('edge')
            .select('edge.to_post_id', 'postId')
            .addSelect('COUNT(*)', 'count')
            .where('edge.edge_type = :type', { type: post_edge_entity_1.EdgeType.LINK })
            .groupBy('edge.to_post_id')
            .orderBy('count', 'DESC')
            .limit(limit)
            .getRawMany();
        if (rankedIds.length === 0) {
            return [];
        }
        const postIds = rankedIds.map(r => r.postId);
        const query = this.postRepo
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.id IN (:...ids)', { ids: postIds })
            .andWhere('post.deleted_at IS NULL');
        if (filter?.lang && filter.lang !== 'all') {
            query.andWhere('post.lang = :lang', { lang: filter.lang });
        }
        const posts = await query.getMany();
        const sortedPosts = postIds
            .map(id => posts.find(p => p.id === id))
            .filter(p => p !== undefined);
        return sortedPosts.map(p => ({
            ...p,
            reasons: ['Many backlinks', 'Link chain'],
        }));
    }
    async getNewsroom(userId, limit = 20, filter) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const postsWithSources = await this.externalSourceRepo
            .createQueryBuilder('source')
            .select('DISTINCT source.post_id', 'postId')
            .leftJoin('posts', 'post', 'post.id = source.post_id')
            .where('post.created_at >= :since', { since: sevenDaysAgo })
            .andWhere('post.deleted_at IS NULL')
            .getRawMany();
        const postIds = postsWithSources.map(p => p.postId);
        if (postIds.length === 0) {
            return [];
        }
        const query = this.postRepo
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.id IN (:...ids)', { ids: postIds });
        if (filter?.lang && filter.lang !== 'all') {
            query.andWhere('post.lang = :lang', { lang: filter.lang });
        }
        const posts = await query
            .orderBy('post.created_at', 'DESC')
            .limit(limit)
            .getMany();
        return posts.map(p => ({
            ...p,
            reasons: ['Recent sources', 'External links'],
        }));
    }
};
exports.ExploreService = ExploreService;
exports.ExploreService = ExploreService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(topic_entity_1.Topic)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(3, (0, typeorm_1.InjectRepository)(post_edge_entity_1.PostEdge)),
    __param(4, (0, typeorm_1.InjectRepository)(follow_entity_1.Follow)),
    __param(5, (0, typeorm_1.InjectRepository)(external_source_entity_1.ExternalSource)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        neo4j_service_1.Neo4jService])
], ExploreService);
//# sourceMappingURL=explore.service.js.map