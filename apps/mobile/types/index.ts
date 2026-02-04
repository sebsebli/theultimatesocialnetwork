export interface User {
  id: string;
  handle: string;
  displayName: string;
  bio?: string;
  /** Storage key for avatar; prefer building URL with getImageUrl(key) so device uses correct API base. */
  avatarKey?: string | null;
  avatarUrl?: string;
  followerCount?: number;
  followingCount?: number;
  quoteReceivedCount?: number;
  /** True when user is in the top 10% by quote_received_count (shows quotes verified badge). */
  quotesBadgeEligible?: boolean;
  /** When true, profile is private; only followers see full content. */
  isProtected?: boolean;
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
  privateLikeCount?: number;
  headerImageKey?: string;
  headerImageBlurhash?: string;
  readingTimeMinutes?: number;
  visibility: 'PUBLIC' | 'FOLLOWERS';
  /** When false, viewer cannot see post body (e.g. FOLLOWERS-only and viewer doesn't follow). Show blurred/private overlay. */
  viewerCanSeeContent?: boolean;
  /** When set, post was soft-deleted; show "deleted on ..." placeholder. */
  deletedAt?: string;
  /** Linked post id -> { title?, deletedAt? } for [[post:id]] display text (from API). */
  referenceMetadata?: Record<string, { title?: string; deletedAt?: string }>;
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
  ownerId?: string;
  owner?: User;
  hasPost?: boolean; // For "Add to Collection" sheet
  /** When true, saves to this collection appear in feed ("X saved to Collection Y"). */
  shareSaves?: boolean;
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
