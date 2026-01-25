// Union type for feed items
export type FeedItem = 
  | { type: 'post'; data: any }
  | { type: 'saved_by'; data: { userId: string; userName: string; collectionId: string; collectionName: string; post: any } };
