"use client";

import { memo } from "react";
import Link from "next/link";
import { PostItem, Post } from "./post-item";

export interface SavedByItemProps {
  userId: string;
  userName: string;
  collectionId: string;
  collectionName: string;
  post: Post;
}

function SavedByItemInner({
  userId,
  userName,
  collectionId,
  collectionName,
  post,
}: SavedByItemProps) {
  if (!post || !post.author) {
    return null;
  }

  return (
    <div className="border-b border-divider bg-ink hover:bg-white/[0.02] transition-colors group">
      <div className="px-5 pt-4 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <svg
            className="w-3.5 h-3.5 text-primary"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <p className="text-[13px] text-tertiary font-medium">
          Saved by{" "}
          <Link
            href={`/user/${post.author.handle || userName}`}
            className="text-paper font-semibold hover:text-primary transition-colors"
          >
            {userName}
          </Link>{" "}
          to{" "}
          <Link
            href={`/collections/${collectionId}`}
            className="text-paper font-semibold hover:text-primary transition-colors"
          >
            {collectionName}
          </Link>
        </p>
      </div>
      <PostItem post={post} />
    </div>
  );
}

export const SavedByItem = memo(SavedByItemInner);
