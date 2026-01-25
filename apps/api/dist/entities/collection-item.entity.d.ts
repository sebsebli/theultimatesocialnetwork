import { Collection } from './collection.entity';
import { Post } from './post.entity';
export declare class CollectionItem {
    id: string;
    collectionId: string;
    collection: Collection;
    postId: string;
    post: Post;
    curatorNote: string;
    addedAt: Date;
    sortOrder: number;
}
