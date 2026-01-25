import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Follow } from '../entities/follow.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Collection } from '../entities/collection.entity';
import { User } from '../entities/user.entity';
import { FeedItem } from './feed-item.entity';
export declare class FeedService {
    private postRepo;
    private followRepo;
    private collectionItemRepo;
    private collectionRepo;
    private userRepo;
    constructor(postRepo: Repository<Post>, followRepo: Repository<Follow>, collectionItemRepo: Repository<CollectionItem>, collectionRepo: Repository<Collection>, userRepo: Repository<User>);
    getHomeFeed(userId: string, limit?: number, offset?: number, includeSavedBy?: boolean): Promise<FeedItem[]>;
}
