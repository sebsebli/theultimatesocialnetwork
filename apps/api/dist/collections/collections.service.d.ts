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
    create(userId: string, title: string, description?: string, isPublic?: boolean, shareSaves?: boolean): Promise<Collection>;
    findAll(userId: string): Promise<{
        itemCount: number;
        id: string;
        ownerId: string;
        owner: User;
        items: CollectionItem[];
        title: string;
        description: string;
        isPublic: boolean;
        shareSaves: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string, userId: string): Promise<{
        items: CollectionItem[];
        id: string;
        ownerId: string;
        owner: User;
        title: string;
        description: string;
        isPublic: boolean;
        shareSaves: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addItem(collectionId: string, postId: string, note?: string): Promise<{
        collectionId: string;
        postId: string;
        curatorNote: string | undefined;
    } & CollectionItem>;
    update(id: string, userId: string, dto: {
        shareSaves?: boolean;
        title?: string;
        description?: string;
        isPublic?: boolean;
    }): Promise<Collection>;
    removeItem(collectionId: string, itemId: string, userId: string): Promise<void>;
}
