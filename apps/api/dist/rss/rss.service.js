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
exports.RssService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const post_entity_1 = require("../entities/post.entity");
let RssService = class RssService {
    usersRepository;
    postsRepository;
    constructor(usersRepository, postsRepository) {
        this.usersRepository = usersRepository;
        this.postsRepository = postsRepository;
    }
    async generateRss(handle) {
        const user = await this.usersRepository.findOne({ where: { handle } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const posts = await this.postsRepository.find({
            where: { authorId: user.id, visibility: 'PUBLIC' },
            order: { createdAt: 'DESC' },
            take: 20,
        });
        const lastBuildDate = new Date().toUTCString();
        const items = posts.map((post) => {
            const title = post.title || 'Untitled Post';
            const link = `https://cite.app/post/${post.id}`;
            const date = new Date(post.createdAt).toUTCString();
            const escapeXml = (unsafe) => {
                return unsafe.replace(/[<>&"']/g, (c) => {
                    switch (c) {
                        case '<': return '&lt;';
                        case '>': return '&gt;';
                        case '&': return '&amp;';
                        case '"': return '&quot;';
                        case "'": return '&apos;';
                        default: return c;
                    }
                });
            };
            const description = escapeXml(post.body.substring(0, 1000));
            return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${date}</pubDate>
      <description>${description}</description>
    </item>`;
        }).join('');
        return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${user.display_name} (@${user.handle}) on Cite</title>
    <link>https://cite.app/user/${user.handle}</link>
    <description>Latest posts from ${user.display_name} on Cite</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>Cite RSS Generator</generator>
    <atom:link href="https://api.cite.app/rss/${user.handle}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
    }
};
exports.RssService = RssService;
exports.RssService = RssService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RssService);
//# sourceMappingURL=rss.service.js.map