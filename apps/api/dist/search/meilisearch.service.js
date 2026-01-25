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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeilisearchService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const meilisearch_1 = __importDefault(require("meilisearch"));
let MeilisearchService = class MeilisearchService {
    configService;
    client;
    indexName = 'posts';
    constructor(configService) {
        this.configService = configService;
        const host = this.configService.get('MEILISEARCH_HOST') || 'http://localhost:7700';
        const apiKey = this.configService.get('MEILISEARCH_MASTER_KEY') || 'masterKey';
        this.client = new meilisearch_1.default({
            host,
            apiKey,
        });
    }
    async onModuleInit() {
        try {
            await this.client.createIndex(this.indexName, { primaryKey: 'id' });
            const index = this.client.index(this.indexName);
            await index.updateSearchableAttributes(['title', 'body', 'author.displayName', 'author.handle']);
            await index.updateFilterableAttributes(['authorId', 'lang', 'createdAt']);
            await index.updateSortableAttributes(['createdAt', 'quoteCount', 'replyCount']);
        }
        catch (error) {
            console.log('Meilisearch index setup:', error.message);
        }
    }
    async indexPost(post) {
        try {
            const index = this.client.index(this.indexName);
            await index.addDocuments([
                {
                    id: post.id,
                    title: post.title || '',
                    body: post.body,
                    authorId: post.authorId,
                    author: post.author ? {
                        displayName: post.author.displayName,
                        handle: post.author.handle,
                    } : null,
                    lang: post.lang || 'en',
                    createdAt: post.createdAt.toISOString(),
                    quoteCount: post.quoteCount,
                    replyCount: post.replyCount,
                },
            ]);
        }
        catch (error) {
            console.error('Failed to index post in Meilisearch', error);
        }
    }
    async searchPosts(query, options) {
        try {
            const index = this.client.index(this.indexName);
            const results = await index.search(query, {
                limit: options?.limit || 20,
                offset: options?.offset || 0,
                filter: options?.lang ? `lang = ${options.lang}` : undefined,
                sort: ['quoteCount:desc', 'createdAt:desc'],
            });
            return results;
        }
        catch (error) {
            console.error('Meilisearch search error', error);
            return { hits: [], estimatedTotalHits: 0 };
        }
    }
    async searchUsers(query, limit = 10) {
        try {
            const index = this.client.index('users');
            return await index.search(query, { limit });
        }
        catch (error) {
            console.error('Meilisearch user search error', error);
            return { hits: [] };
        }
    }
    async deletePost(postId) {
        try {
            const index = this.client.index(this.indexName);
            await index.deleteDocument(postId);
        }
        catch (error) {
            console.error('Failed to delete post from Meilisearch', error);
        }
    }
};
exports.MeilisearchService = MeilisearchService;
exports.MeilisearchService = MeilisearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MeilisearchService);
//# sourceMappingURL=meilisearch.service.js.map