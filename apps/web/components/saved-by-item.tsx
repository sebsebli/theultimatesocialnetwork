'use client';

import Link from 'next/link';
import { PostItem, Post } from './post-item';

interface SavedByItemProps {
  userId: string;
  userName: string;
  collectionId: string;
  collectionName: string;
  post: Post;
}

export function SavedByItem({ userId, userName, collectionId, collectionName, post }: SavedByItemProps) {
  if (!post || !post.author) {
    return null;
  }

  return (
    <div className="border-b border-divider bg-ink">
      <div className="px-5 pt-4 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-tertiary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <p className="text-[13px] text-tertiary font-medium">
          Saved by{' '}
          <Link href={`/user/${post.author.handle || userName}`} className="text-paper font-semibold">
            {userName}
          </Link>
          {' '}to{' '}
          <Link href={`/collections/${collectionId}`} className="text-paper font-semibold">
            {collectionName}
          </Link>
        </p>
      </div>
      <PostItem post={post} />
    </div>
  );
}
