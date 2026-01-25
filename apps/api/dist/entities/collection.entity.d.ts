import { User } from './user.entity';
import { CollectionItem } from './collection-item.entity';
export declare class Collection {
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
}
