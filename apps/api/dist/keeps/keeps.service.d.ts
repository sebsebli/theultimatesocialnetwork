import { Repository } from 'typeorm';
import { Keep } from '../entities/keep.entity';
import { Post } from '../entities/post.entity';
import { CollectionItem } from '../entities/collection-item.entity';
export declare class KeepsService {
    private keepRepo;
    private postRepo;
    private collectionItemRepo;
    constructor(keepRepo: Repository<Keep>, postRepo: Repository<Post>, collectionItemRepo: Repository<CollectionItem>);
    getAll(userId: string, filters?: {
        search?: string;
        inCollection?: boolean;
    }): unknown;
}
