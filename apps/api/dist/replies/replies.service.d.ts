import { Repository, DataSource } from 'typeorm';
import { Reply } from '../entities/reply.entity';
import { Post } from '../entities/post.entity';
import { Mention } from '../entities/mention.entity';
import { User } from '../entities/user.entity';
import { LanguageDetectionService } from '../shared/language-detection.service';
import { Neo4jService } from '../database/neo4j.service';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { SafetyService } from '../safety/safety.service';
export declare class RepliesService {
    private replyRepo;
    private postRepo;
    private mentionRepo;
    private userRepo;
    private dataSource;
    private languageDetection;
    private neo4jService;
    private notificationHelper;
    private safetyService;
    constructor(replyRepo: Repository<Reply>, postRepo: Repository<Post>, mentionRepo: Repository<Mention>, userRepo: Repository<User>, dataSource: DataSource, languageDetection: LanguageDetectionService, neo4jService: Neo4jService, notificationHelper: NotificationHelperService, safetyService: SafetyService);
    create(userId: string, postId: string, body: string, parentReplyId?: string): unknown;
    findByPost(postId: string): unknown;
    delete(userId: string, replyId: string): any;
}
