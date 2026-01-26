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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("../entities/post.entity");
const post_edge_entity_1 = require("../entities/post-edge.entity");
const topic_entity_1 = require("../entities/topic.entity");
const post_topic_entity_1 = require("../entities/post-topic.entity");
const external_source_entity_1 = require("../entities/external-source.entity");
const user_entity_1 = require("../entities/user.entity");
const mention_entity_1 = require("../entities/mention.entity");
const neo4j_service_1 = require("../database/neo4j.service");
const language_detection_service_1 = require("../shared/language-detection.service");
const meilisearch_service_1 = require("../search/meilisearch.service");
const notification_helper_service_1 = require("../shared/notification-helper.service");
const safety_service_1 = require("../safety/safety.service");
let PostsService = class PostsService {
    postRepo;
    externalSourceRepo;
    mentionRepo;
    userRepo;
    dataSource;
    neo4jService;
    languageDetection;
    meilisearch;
    notificationHelper;
    safetyService;
    constructor(postRepo, externalSourceRepo, mentionRepo, userRepo, dataSource, neo4jService, languageDetection, meilisearch, notificationHelper, safetyService) {
        this.postRepo = postRepo;
        this.externalSourceRepo = externalSourceRepo;
        this.mentionRepo = mentionRepo;
        this.userRepo = userRepo;
        this.dataSource = dataSource;
        this.neo4jService = neo4jService;
        this.languageDetection = languageDetection;
        this.meilisearch = meilisearch;
        this.notificationHelper = notificationHelper;
        this.safetyService = safetyService;
    }
    async create(userId, dto) {
        const { default: DOMPurify } = await import('isomorphic-dompurify');
        const sanitizedBody = DOMPurify.sanitize(dto.body, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
            KEEP_CONTENT: true,
        });
        const safety = await this.safetyService.checkContent(sanitizedBody, userId, 'post');
        if (!safety.safe) {
            throw new common_1.BadRequestException(safety.reason || 'Content flagged by safety check');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let savedPost;
        const neo4jCommands = [];
        try {
            const titleMatch = sanitizedBody.match(/^#\s+(.+)$/m);
            const title = titleMatch ? DOMPurify.sanitize(titleMatch[1].trim(), { ALLOWED_TAGS: [] }) : null;
            const user = await this.userRepo.findOne({ where: { id: userId }, select: ['languages'] });
            const { lang, confidence } = await this.languageDetection.detectLanguage(sanitizedBody, userId, user?.languages || []);
            const wordCount = sanitizedBody.split(/\s+/).length;
            const readingTime = Math.ceil(wordCount / 200);
            const post = this.postRepo.create({
                authorId: userId,
                body: sanitizedBody,
                title: title,
                headerImageKey: dto.headerImageKey,
                headerImageBlurhash: dto.headerImageBlurhash,
                visibility: dto.visibility,
                lang: lang,
                langConfidence: confidence,
                readingTimeMinutes: readingTime,
            });
            savedPost = await queryRunner.manager.save(post_entity_1.Post, post);
            neo4jCommands.push(async () => {
                await this.neo4jService.run(`
          MERGE (u:User {id: $userId})
          CREATE (p:Post {id: $postId, createdAt: $createdAt})
          MERGE (u)-[:AUTHORED]->(p)
          `, { userId, postId: savedPost.id, createdAt: savedPost.createdAt.toISOString() });
            });
            const wikilinkRegex = /\[\[(.*?)\]\]/g;
            let match;
            while ((match = wikilinkRegex.exec(sanitizedBody)) !== null) {
                const content = match[1];
                const parts = content.split('|');
                const targetsRaw = parts[0];
                const alias = parts[1]?.trim() || null;
                const targetItems = targetsRaw.split(',').map((s) => s.trim());
                for (const target of targetItems) {
                    if (target.toLowerCase().startsWith('post:')) {
                        const targetUuid = target.split(':')[1];
                        if (this.isValidUUID(targetUuid)) {
                            const targetPost = await queryRunner.manager.findOne(post_entity_1.Post, { where: { id: targetUuid } });
                            if (targetPost) {
                                await queryRunner.manager.save(post_edge_entity_1.PostEdge, {
                                    fromPostId: savedPost.id,
                                    toPostId: targetUuid,
                                    edgeType: post_edge_entity_1.EdgeType.LINK,
                                    anchorText: alias,
                                });
                                neo4jCommands.push(async () => {
                                    await this.neo4jService.run(`
                    MATCH (p1:Post {id: $fromId})
                    MERGE (p2:Post {id: $toId})
                    MERGE (p1)-[:LINKS_TO]->(p2)
                    `, { fromId: savedPost.id, toId: targetUuid });
                                });
                            }
                        }
                    }
                    else if (target.startsWith('http')) {
                        await queryRunner.manager.save(external_source_entity_1.ExternalSource, {
                            postId: savedPost.id,
                            url: target,
                            title: alias,
                        });
                        fetch(`https://web.archive.org/save/${target}`).catch(() => { });
                    }
                    else {
                        const slug = this.slugify(target);
                        let topic = await queryRunner.manager.findOne(topic_entity_1.Topic, {
                            where: { slug },
                        });
                        if (!topic) {
                            topic = queryRunner.manager.create(topic_entity_1.Topic, {
                                slug,
                                title: target,
                                createdBy: userId,
                            });
                            topic = await queryRunner.manager.save(topic_entity_1.Topic, topic);
                        }
                        await queryRunner.manager.save(post_topic_entity_1.PostTopic, {
                            postId: savedPost.id,
                            topicId: topic.id,
                        });
                        neo4jCommands.push(async () => {
                            await this.neo4jService.run(`
                MATCH (p:Post {id: $postId})
                MERGE (t:Topic {slug: $slug})
                ON CREATE SET t.title = $title
                MERGE (p)-[:IN_TOPIC]->(t)
                `, { postId: savedPost.id, slug: topic.slug, title: topic.title });
                        });
                    }
                }
            }
            const mentionRegex = /@(\w+)/g;
            let mentionMatch;
            const mentionedHandles = new Set();
            while ((mentionMatch = mentionRegex.exec(sanitizedBody)) !== null) {
                mentionedHandles.add(mentionMatch[1]);
            }
            for (const handle of mentionedHandles) {
                const mentionedUser = await queryRunner.manager.findOne(user_entity_1.User, {
                    where: { handle },
                });
                if (mentionedUser && mentionedUser.id !== userId) {
                    await queryRunner.manager.save(mention_entity_1.Mention, {
                        postId: savedPost.id,
                        mentionedUserId: mentionedUser.id,
                    });
                    await this.notificationHelper.createNotification({
                        userId: mentionedUser.id,
                        type: 'MENTION',
                        actorUserId: userId,
                        postId: savedPost.id,
                    });
                    neo4jCommands.push(async () => {
                        await this.neo4jService.run(`
              MATCH (p:Post {id: $postId})
              MERGE (u:User {id: $userId})
              MERGE (p)-[:MENTIONS]->(u)
              `, { postId: savedPost.id, userId: mentionedUser.id });
                    });
                }
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
        Promise.allSettled(neo4jCommands.map(cmd => cmd())).then(results => {
        });
        const author = await this.postRepo.manager.findOne(user_entity_1.User, { where: { id: savedPost.authorId } });
        this.meilisearch.indexPost({
            id: savedPost.id,
            title: savedPost.title,
            body: savedPost.body,
            authorId: savedPost.authorId,
            author: author ? {
                displayName: author.displayName || author.handle,
                handle: author.handle,
            } : undefined,
            lang: savedPost.lang,
            createdAt: savedPost.createdAt,
            quoteCount: savedPost.quoteCount,
            replyCount: savedPost.replyCount,
        }).catch(err => console.error('Meilisearch indexing error', err));
        return savedPost;
    }
    slugify(text) {
        return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
    }
    isValidUUID(uuid) {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return regex.test(uuid);
    }
    async findOne(id, viewerId) {
        const post = await this.postRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!post)
            return null;
        if (post.visibility === post_entity_1.PostVisibility.PUBLIC) {
            return post;
        }
        if (!viewerId) {
            return null;
        }
        if (post.authorId === viewerId) {
            return post;
        }
        if (post.visibility === post_entity_1.PostVisibility.FOLLOWERS) {
            const isFollowing = await this.dataSource.query(`SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2`, [viewerId, post.authorId]);
            if (isFollowing.length > 0) {
                return post;
            }
        }
        return null;
    }
    async softDelete(userId, postId) {
        const post = await this.postRepo.findOne({
            where: { id: postId, authorId: userId },
        });
        if (!post) {
            throw new Error('Post not found or unauthorized');
        }
        await this.postRepo.softDelete(postId);
        this.meilisearch.deletePost(postId).catch(err => console.error('Failed to delete from Meilisearch', err));
    }
    async createQuote(userId, quotedPostId, commentary) {
        if (!commentary || commentary.trim().length === 0) {
            throw new Error('Commentary is required for quotes');
        }
        const quotedPost = await this.postRepo.findOne({
            where: { id: quotedPostId },
        });
        if (!quotedPost) {
            throw new Error('Quoted post not found');
        }
        const quoteBody = `${commentary}\n\n[[post:${quotedPostId}]]`;
        const quotePost = await this.create(userId, {
            body: quoteBody,
            visibility: post_entity_1.PostVisibility.PUBLIC,
        });
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await queryRunner.manager.save(post_edge_entity_1.PostEdge, {
                fromPostId: quotePost.id,
                toPostId: quotedPostId,
                edgeType: post_edge_entity_1.EdgeType.QUOTE,
            });
            await this.postRepo.increment({ id: quotedPostId }, 'quoteCount', 1);
            if (quotedPost.authorId !== userId) {
                await this.notificationHelper.createNotification({
                    userId: quotedPost.authorId,
                    type: 'QUOTE',
                    actorUserId: userId,
                    postId: quotedPostId,
                });
            }
            await this.neo4jService.run(`
        MATCH (p1:Post {id: $fromId})
        MATCH (p2:Post {id: $toId})
        MERGE (p1)-[:QUOTES]->(p2)
        `, { fromId: quotePost.id, toId: quotedPostId });
        }
        finally {
            await queryRunner.release();
        }
        return quotePost;
    }
    async getSources(postId) {
        return this.externalSourceRepo.find({
            where: { postId },
            order: { createdAt: 'ASC' },
        });
    }
    async getReferencedBy(postId) {
        const edges = await this.dataSource
            .getRepository(post_edge_entity_1.PostEdge)
            .find({
            where: [
                { toPostId: postId, edgeType: post_edge_entity_1.EdgeType.LINK },
                { toPostId: postId, edgeType: post_edge_entity_1.EdgeType.QUOTE },
            ],
            relations: ['fromPost', 'fromPost.author'],
            take: 20,
            order: { createdAt: 'DESC' },
        });
        return edges
            .filter(edge => edge.fromPost && !edge.fromPost.deletedAt)
            .map(edge => edge.fromPost)
            .filter((post) => post !== null);
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(external_source_entity_1.ExternalSource)),
    __param(2, (0, typeorm_1.InjectRepository)(mention_entity_1.Mention)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        neo4j_service_1.Neo4jService,
        language_detection_service_1.LanguageDetectionService,
        meilisearch_service_1.MeilisearchService,
        notification_helper_service_1.NotificationHelperService,
        safety_service_1.SafetyService])
], PostsService);
//# sourceMappingURL=posts.service.js.map