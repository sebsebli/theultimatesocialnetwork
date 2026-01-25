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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const post_entity_1 = require("../entities/post.entity");
const reply_entity_1 = require("../entities/reply.entity");
const post_edge_entity_1 = require("../entities/post-edge.entity");
const like_entity_1 = require("../entities/like.entity");
const keep_entity_1 = require("../entities/keep.entity");
const follow_entity_1 = require("../entities/follow.entity");
const post_read_entity_1 = require("../entities/post-read.entity");
const notification_entity_1 = require("../entities/notification.entity");
let UsersService = class UsersService {
    userRepo;
    postRepo;
    replyRepo;
    postEdgeRepo;
    likeRepo;
    keepRepo;
    followRepo;
    readRepo;
    notifRepo;
    constructor(userRepo, postRepo, replyRepo, postEdgeRepo, likeRepo, keepRepo, followRepo, readRepo, notifRepo) {
        this.userRepo = userRepo;
        this.postRepo = postRepo;
        this.replyRepo = replyRepo;
        this.postEdgeRepo = postEdgeRepo;
        this.likeRepo = likeRepo;
        this.keepRepo = keepRepo;
        this.followRepo = followRepo;
        this.readRepo = readRepo;
        this.notifRepo = notifRepo;
    }
    async findByHandle(handle) {
        const user = await this.userRepo.findOne({
            where: { handle },
        });
        if (!user) {
            return null;
        }
        const posts = await this.postRepo.find({
            where: { authorId: user.id },
            relations: ['author'],
            order: { createdAt: 'DESC' },
            take: 20,
        });
        return {
            ...user,
            posts,
        };
    }
    async findById(id) {
        const user = await this.userRepo.findOne({
            where: { id },
        });
        if (!user) {
            return null;
        }
        const posts = await this.postRepo.find({
            where: { authorId: user.id },
            relations: ['author'],
            order: { createdAt: 'DESC' },
            take: 20,
        });
        return {
            ...user,
            posts,
        };
    }
    async update(id, updates) {
        await this.userRepo.update(id, updates);
        return this.userRepo.findOneOrFail({ where: { id } });
    }
    async getSuggested(userId, limit = 10) {
        return this.userRepo.find({
            order: { followerCount: 'DESC' },
            take: limit,
        });
    }
    async getReplies(userId) {
        return this.replyRepo.find({
            where: { authorId: userId },
            relations: ['post', 'post.author'],
            order: { createdAt: 'DESC' },
            take: 20,
        });
    }
    async getQuotes(userId) {
        return this.postRepo.createQueryBuilder('quoter')
            .innerJoin(post_edge_entity_1.PostEdge, 'edge', 'edge.from_post_id = quoter.id')
            .innerJoin('posts', 'quoted', 'quoted.id = edge.to_post_id')
            .where('edge.edge_type = :type', { type: post_edge_entity_1.EdgeType.QUOTE })
            .andWhere('quoted.author_id = :userId', { userId })
            .leftJoinAndSelect('quoter.author', 'author')
            .orderBy('quoter.created_at', 'DESC')
            .take(20)
            .getMany();
    }
    async deleteUser(userId) {
        await this.userRepo.softDelete(userId);
        await this.postRepo.softDelete({ authorId: userId });
        return { success: true };
    }
    async exportUserData(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const posts = await this.postRepo.find({ where: { authorId: userId } });
        const replies = await this.replyRepo.find({ where: { authorId: userId } });
        const likes = await this.likeRepo.find({ where: { userId } });
        const keeps = await this.keepRepo.find({ where: { userId } });
        const following = await this.followRepo.find({ where: { followerId: userId } });
        const followers = await this.followRepo.find({ where: { followeeId: userId } });
        const reads = await this.readRepo.find({ where: { userId } });
        const notifications = await this.notifRepo.find({ where: { userId } });
        return {
            user,
            posts,
            replies,
            likes,
            keeps,
            following,
            followers,
            readHistory: reads,
            notifications,
            exportedAt: new Date(),
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(2, (0, typeorm_1.InjectRepository)(reply_entity_1.Reply)),
    __param(3, (0, typeorm_1.InjectRepository)(post_edge_entity_1.PostEdge)),
    __param(4, (0, typeorm_1.InjectRepository)(like_entity_1.Like)),
    __param(5, (0, typeorm_1.InjectRepository)(keep_entity_1.Keep)),
    __param(6, (0, typeorm_1.InjectRepository)(follow_entity_1.Follow)),
    __param(7, (0, typeorm_1.InjectRepository)(post_read_entity_1.PostRead)),
    __param(8, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map