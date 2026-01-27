import type { Post } from '../entities/post.entity';

// Union type for feed items
export type SavedByData = {
  userId: string;
  userName: string;
  collectionId: string;
  collectionName: string;
  post?: Post;
};

export type FeedItem =
  | { type: 'post'; data: Post }
  | { type: 'saved_by'; data: SavedByData };
