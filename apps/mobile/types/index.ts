export interface User {
  id: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  followerCount?: number;
  followingCount?: number;
  quoteReceivedCount?: number;
}

export interface Post {
  id: string;
  title?: string;
  body: string;
  author: User;
  createdAt: string;
  updatedAt?: string;
  replyCount: number;
  quoteCount: number;
  isLiked?: boolean;
  isKept?: boolean;
  headerImageKey?: string;
  headerImageBlurhash?: string;
  readingTimeMinutes?: number;
  visibility: 'PUBLIC' | 'FOLLOWERS';
  // UI helper props
  _isSavedBy?: boolean;
  _savedBy?: {
    userId: string;
    userName: string;
    collectionName: string;
  };
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description?: string;
  postCount?: number;
  contributorCount?: number;
  isFollowing?: boolean;
  startHere?: Post[];
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  itemCount: number;
  owner?: User;
  hasPost?: boolean; // For "Add to Collection" sheet
}

export interface CollectionItem {
  id: string;
  post: Post;
  curatorNote?: string;
  addedAt: string;
}

export interface Notification {
  id: string;
  type: 'FOLLOW' | 'FOLLOW_REQUEST' | 'REPLY' | 'QUOTE' | 'LIKE' | 'MENTION' | 'COLLECTION_ADD';
  actor: User;
  post?: Post;
  reply?: { id: string; body: string };
  collection?: Collection;
  createdAt: string;
  readAt?: string;
}
