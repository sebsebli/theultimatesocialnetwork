import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
export declare class ContentModerationService implements OnModuleInit {
    private postRepo;
    private replyRepo;
    private bayesianClassifier;
    private isGemmaAvailable;
    constructor(postRepo: Repository<Post>, replyRepo: Repository<Reply>);
    onModuleInit(): any;
    private trainBayesianClassifier;
    private checkGemmaAvailability;
    private checkRepeatedContent;
    private calculateSimilarity;
    private stage1BayesianFilter;
    private stage2GemmaAnalysis;
    private fallbackContentAnalysis;
    checkContent(text: string, userId: string, contentType?: 'post' | 'reply'): Promise<{
        safe: boolean;
        reason?: string;
        confidence?: number;
    }>;
    checkImage(buffer: Buffer): Promise<{
        safe: boolean;
        reason?: string;
        confidence?: number;
    }>;
    private stage2GemmaImageAnalysis;
    private fallbackImageAnalysis;
}
