import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import Redis from 'ioredis';
export declare class LanguageDetectionService {
    private postRepo;
    private userRepo;
    private redis;
    constructor(postRepo: Repository<Post>, userRepo: Repository<User>, redis: Redis);
    private getUserMostCommonLanguage;
    detectLanguage(text: string, userId?: string, userLanguages?: string[]): Promise<{
        lang: string;
        confidence: number;
    }>;
}
