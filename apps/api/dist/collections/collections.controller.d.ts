import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
export declare class CollectionsController {
    private readonly collectionsService;
    constructor(collectionsService: CollectionsService);
    create(user: {
        id: string;
    }, dto: CreateCollectionDto): Promise<import("../entities/collection.entity").Collection>;
    findAll(user: {
        id: string;
    }): Promise<import("../entities/collection.entity").Collection[]>;
    findOne(user: {
        id: string;
    }, id: string): Promise<{
        items: import("../entities/collection-item.entity").CollectionItem[];
        id: string;
        ownerId: string;
        owner: import("../entities/user.entity").User;
        title: string;
        description: string;
        isPublic: boolean;
        shareSaves: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addItem(id: string, dto: AddItemDto): Promise<{
        collectionId: string;
        postId: string;
        curatorNote: string | undefined;
    } & import("../entities/collection-item.entity").CollectionItem>;
    update(user: {
        id: string;
    }, id: string, dto: UpdateCollectionDto): Promise<import("../entities/collection.entity").Collection>;
    removeItem(user: {
        id: string;
    }, collectionId: string, itemId: string): Promise<void>;
}
