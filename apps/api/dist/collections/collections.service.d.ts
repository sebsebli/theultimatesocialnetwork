import { Repository } from 'typeorm';
import { Collection } from '../entities/collection.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
export declare class CollectionsService {
    private collectionRepo;
    private itemRepo;
    private postRepo;
    private userRepo;
    constructor(collectionRepo: Repository<Collection>, itemRepo: Repository<CollectionItem>, postRepo: Repository<Post>, userRepo: Repository<User>);
    create(userId: string, title: string, description?: string, isPublic?: boolean, shareSaves?: boolean): unknown;
    findAll(userId: string): unknown;
    findOne(id: string, userId: string): unknown;
    addItem(collectionId: string, postId: string, note?: string): unknown;
    update(id: string, userId: string, dto: {
        shareSaves?: boolean;
        title?: string;
        description?: string;
        isPublic?: boolean;
    }): unknown;
    removeItem(collectionId: string, itemId: string, userId: string): any;
}
