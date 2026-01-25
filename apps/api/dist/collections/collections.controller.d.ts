import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
export declare class CollectionsController {
    private readonly collectionsService;
    constructor(collectionsService: CollectionsService);
    create(user: {
        id: string;
    }, dto: CreateCollectionDto): unknown;
    findAll(user: {
        id: string;
    }): unknown;
    findOne(user: {
        id: string;
    }, id: string): unknown;
    addItem(id: string, dto: AddItemDto): unknown;
    update(user: {
        id: string;
    }, id: string, dto: UpdateCollectionDto): unknown;
    removeItem(user: {
        id: string;
    }, collectionId: string, itemId: string): any;
}
