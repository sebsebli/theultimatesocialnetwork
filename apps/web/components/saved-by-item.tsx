"use client";

import { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostItem, Post } from "./post-item";

export interface SavedByItemProps {
  userId: string;
  userName: string;
  /** When missing, "to collection" links to /collections */
  collectionId?: string;
  collectionName: string;
  post: Post;
}

function SavedByItemInner({
  userName,
  collectionId,
  collectionName,
  post,
}: SavedByItemProps) {
  const router = useRouter();

  if (!post || !post.author) {
    return null;
  }

  const collectionHref = collectionId
    ? `/collections/${collectionId}`
    : "/collections";
  const userHref = `/user/${post.author.handle || userName}`;

  return (
    <div className="border-b border-divider bg-ink hover:bg-white/[0.02] transition-colors group">
      <Link
        href={collectionHref}
        className="block px-5 pt-4 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-lg"
        aria-label={`Saved by ${userName} to ${collectionName} — Open collection`}
      >
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
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(userHref);
            }}
            className="text-paper font-semibold hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 inline"
          >
            {userName}
          </button>{" "}
          to <span className="text-paper font-semibold">{collectionName}</span>
        </p>
      </Link>
      <PostItem post={post} />
    </div>
  );
}

export const SavedByItem = memo(SavedByItemInner);
