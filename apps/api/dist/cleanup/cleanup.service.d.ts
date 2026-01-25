import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
export declare class CleanupService {
    private postRepo;
    private userRepo;
    private readonly logger;
    constructor(postRepo: Repository<Post>, userRepo: Repository<User>);
    handleCron(): Promise<void>;
    private deleteOldSoftDeletedPosts;
    private deleteOldSoftDeletedUsers;
}
