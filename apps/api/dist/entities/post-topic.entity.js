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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostTopic = void 0;
const typeorm_1 = require("typeorm");
const post_entity_1 = require("./post.entity");
const topic_entity_1 = require("./topic.entity");
let PostTopic = class PostTopic {
    postId;
    topicId;
    post;
    topic;
};
exports.PostTopic = PostTopic;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'post_id' }),
    __metadata("design:type", String)
], PostTopic.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'topic_id' }),
    __metadata("design:type", String)
], PostTopic.prototype, "topicId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => post_entity_1.Post),
    (0, typeorm_1.JoinColumn)({ name: 'post_id' }),
    __metadata("design:type", post_entity_1.Post)
], PostTopic.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => topic_entity_1.Topic),
    (0, typeorm_1.JoinColumn)({ name: 'topic_id' }),
    __metadata("design:type", topic_entity_1.Topic)
], PostTopic.prototype, "topic", void 0);
exports.PostTopic = PostTopic = __decorate([
    (0, typeorm_1.Entity)('post_topics')
], PostTopic);
//# sourceMappingURL=post-topic.entity.js.map