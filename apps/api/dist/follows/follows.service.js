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
exports.FollowsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const follow_entity_1 = require("../entities/follow.entity");
const follow_request_entity_1 = require("../entities/follow-request.entity");
const user_entity_1 = require("../entities/user.entity");
const neo4j_service_1 = require("../database/neo4j.service");
let FollowsService = class FollowsService {
    followRepo;
    followRequestRepo;
    userRepo;
    dataSource;
    neo4jService;
    constructor(followRepo, followRequestRepo, userRepo, dataSource, neo4jService) {
        this.followRepo = followRepo;
        this.followRequestRepo = followRequestRepo;
        this.userRepo = userRepo;
        this.dataSource = dataSource;
        this.neo4jService = neo4jService;
    }
    async follow(followerId, followeeId) {
        if (followerId === followeeId) {
            throw new Error('Cannot follow yourself');
        }
        const followee = await this.userRepo.findOne({ where: { id: followeeId } });
        if (!followee) {
            throw new common_1.NotFoundException('User not found');
        }
        const existing = await this.followRepo.findOne({
            where: { followerId, followeeId },
        });
        if (existing) {
            throw new common_1.ConflictException('Already following');
        }
        if (followee.isProtected) {
            const existingRequest = await this.followRequestRepo.findOne({
                where: {
                    requesterId: followerId,
                    targetId: followeeId,
                    status: follow_request_entity_1.FollowRequestStatus.PENDING
                },
            });
            if (existingRequest) {
                throw new common_1.ConflictException('Follow request already pending');
            }
            const request = this.followRequestRepo.create({
                requesterId: followerId,
                targetId: followeeId,
                status: follow_request_entity_1.FollowRequestStatus.PENDING,
            });
            return this.followRequestRepo.save(request);
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const follow = this.followRepo.create({ followerId, followeeId });
            await queryRunner.manager.save(follow_entity_1.Follow, follow);
            await queryRunner.manager.increment(user_entity_1.User, { id: followeeId }, 'followerCount', 1);
            await queryRunner.manager.increment(user_entity_1.User, { id: followerId }, 'followingCount', 1);
            await queryRunner.commitTransaction();
            this.neo4jService.run(`
        MERGE (u1:User {id: $followerId})
        MERGE (u2:User {id: $followeeId})
        MERGE (u1)-[:FOLLOWS]->(u2)
        `, { followerId, followeeId }).catch(err => console.error('Neo4j follow sync error', err));
            return follow;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async unfollow(followerId, followeeId) {
        const follow = await this.followRepo.findOne({
            where: { followerId, followeeId },
        });
        if (!follow) {
            throw new common_1.NotFoundException('Not following');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.remove(follow);
            await queryRunner.manager.decrement(user_entity_1.User, { id: followeeId }, 'followerCount', 1);
            await queryRunner.manager.decrement(user_entity_1.User, { id: followerId }, 'followingCount', 1);
            await queryRunner.commitTransaction();
            this.neo4jService.run(`
        MATCH (u1:User {id: $followerId})-[r:FOLLOWS]->(u2:User {id: $followeeId})
        DELETE r
        `, { followerId, followeeId }).catch(err => console.error('Neo4j unfollow sync error', err));
            return { success: true };
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async approveFollowRequest(userId, requestId) {
        const request = await this.followRequestRepo.findOne({
            where: { id: requestId, targetId: userId, status: follow_request_entity_1.FollowRequestStatus.PENDING },
        });
        if (!request) {
            throw new common_1.NotFoundException('Follow request not found');
        }
        request.status = follow_request_entity_1.FollowRequestStatus.APPROVED;
        await this.followRequestRepo.save(request);
        await this.follow(request.requesterId, request.targetId);
        return request;
    }
    async rejectFollowRequest(userId, requestId) {
        const request = await this.followRequestRepo.findOne({
            where: { id: requestId, targetId: userId, status: follow_request_entity_1.FollowRequestStatus.PENDING },
        });
        if (!request) {
            throw new common_1.NotFoundException('Follow request not found');
        }
        request.status = follow_request_entity_1.FollowRequestStatus.REJECTED;
        await this.followRequestRepo.save(request);
        return request;
    }
};
exports.FollowsService = FollowsService;
exports.FollowsService = FollowsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(follow_entity_1.Follow)),
    __param(1, (0, typeorm_1.InjectRepository)(follow_request_entity_1.FollowRequest)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        neo4j_service_1.Neo4jService])
], FollowsService);
//# sourceMappingURL=follows.service.js.map