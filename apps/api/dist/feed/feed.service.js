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
exports.FeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("../entities/post.entity");
const follow_entity_1 = require("../entities/follow.entity");
const collection_item_entity_1 = require("../entities/collection-item.entity");
const collection_entity_1 = require("../entities/collection.entity");
const user_entity_1 = require("../entities/user.entity");
let FeedService = class FeedService {
    postRepo;
    followRepo;
    collectionItemRepo;
    collectionRepo;
    userRepo;
    constructor(postRepo, followRepo, collectionItemRepo, collectionRepo, userRepo) {
        this.postRepo = postRepo;
        this.followRepo = followRepo;
        this.collectionItemRepo = collectionItemRepo;
        this.collectionRepo = collectionRepo;
        this.userRepo = userRepo;
    }
    async getHomeFeed(userId, limit = 20, offset = 0, includeSavedBy = false) {
        const follows = await this.followRepo.find({ where: { followerId: userId } });
        const followingIds = follows.map(f => f.followeeId);
        followingIds.push(userId);
        if (followingIds.length === 0)
            return [];
        const posts = await this.postRepo
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.deleted_at IS NULL')
            .andWhere('(post.author_id IN (:...followingIds) AND post.visibility = :public) OR post.author_id = :userId', { followingIds: followingIds.length > 0 ? followingIds : ['00000000-0000-0000-0000-000000000000'], public: 'PUBLIC', userId })
            .orderBy('post.created_at', 'DESC')
            .skip(offset)
            .take(limit * 2)
            .getMany()
            .then(allPosts => allPosts
            .filter(post => followingIds.includes(post.authorId) &&
            !post.deletedAt &&
            (post.visibility === 'PUBLIC' || post.authorId === userId))
            .slice(0, limit));
        const feedItems = posts.map(post => ({
            type: 'post',
            data: post,
        }));
        if (includeSavedBy) {
            const recentSaves = await this.collectionItemRepo
                .createQueryBuilder('item')
                .leftJoinAndSelect('item.collection', 'collection')
                .leftJoinAndSelect('item.post', 'post')
                .leftJoinAndSelect('post.author', 'postAuthor')
                .leftJoinAndSelect('collection.owner', 'saver')
                .where('collection.owner_id IN (:...ids)', { ids: followingIds })
                .andWhere('collection.is_public = true')
                .andWhere('collection.share_saves = true')
                .andWhere('item.added_at >= :since', { since: new Date(Date.now() - 24 * 60 * 60 * 1000) })
                .orderBy('item.added_at', 'DESC')
                .limit(10)
                .getMany();
            for (const save of recentSaves) {
                if (save.collection.owner) {
                    feedItems.push({
                        type: 'saved_by',
                        data: {
                            userId: save.collection.owner.id,
                            userName: save.collection.owner.displayName || save.collection.owner.handle,
                            collectionId: save.collection.id,
                            collectionName: save.collection.title,
                            post: save.post,
                        },
                    });
                }
            }
        }
        feedItems.sort((a, b) => {
            let aTime;
            let bTime;
            if (a.type === 'post') {
                aTime = a.data.createdAt || new Date(0);
            }
            else {
                const savedData = a.data;
                aTime = savedData.post?.createdAt || new Date(0);
            }
            if (b.type === 'post') {
                bTime = b.data.createdAt || new Date(0);
            }
            else {
                const savedData = b.data;
                bTime = savedData.post?.createdAt || new Date(0);
            }
            return bTime.getTime() - aTime.getTime();
        });
        return feedItems.slice(0, limit);
    }
};
exports.FeedService = FeedService;
exports.FeedService = FeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(follow_entity_1.Follow)),
    __param(2, (0, typeorm_1.InjectRepository)(collection_item_entity_1.CollectionItem)),
    __param(3, (0, typeorm_1.InjectRepository)(collection_entity_1.Collection)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], FeedService);
//# sourceMappingURL=feed.service.js.map