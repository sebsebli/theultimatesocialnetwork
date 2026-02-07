import type { Post } from '../entities/post.entity';

/**
 * Explains why a post appeared in the user's home feed.
 * - followed_author: The user follows the post's author
 * - followed_topic: The post belongs to a topic the user follows
 * - own_post: The post was authored by the user themselves
 */
export type FeedReason =
  | { type: 'followed_author'; authorHandle?: string; authorDisplayName?: string }
  | { type: 'followed_topic'; topicTitle?: string; topicSlug?: string }
  | { type: 'own_post' };

// Union type for feed items
export type SavedByData = {
  userId: string;
  userName: string;
  collectionId: string;
  collectionName: string;
  post?: Post;
};

export type FeedItem =
  | { type: 'post'; data: Post; reason?: FeedReason }
  | { type: 'saved_by'; data: SavedByData };
