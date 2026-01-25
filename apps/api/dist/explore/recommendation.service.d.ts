import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { Follow } from '../entities/follow.entity';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';
export declare class RecommendationService implements OnModuleInit {
    private postRepo;
    private userRepo;
    private postTopicRepo;
    private followRepo;
    private likeRepo;
    private keepRepo;
    private embeddingModel;
    private isModelLoaded;
    constructor(postRepo: Repository<Post>, userRepo: Repository<User>, postTopicRepo: Repository<PostTopic>, followRepo: Repository<Follow>, likeRepo: Repository<Like>, keepRepo: Repository<Keep>);
    onModuleInit(): Promise<void>;
    private loadEmbeddingModel;
    private generateEmbedding;
    private cosineSimilarity;
    private getUserInterestProfile;
    getRecommendedPosts(userId: string, limit?: number): Promise<Post[]>;
    private getTrendingPosts;
    private getFallbackRecommendations;
    getRecommendedPeople(userId: string, limit?: number): Promise<User[]>;
}
