import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
export declare class LanguageDetectionService {
    private postRepo;
    private userRepo;
    constructor(postRepo: Repository<Post>, userRepo: Repository<User>);
    private getUserMostCommonLanguage;
    detectLanguage(text: string, userId?: string, userLanguages?: string[]): Promise<{
        lang: string;
        confidence: number;
    }>;
}
