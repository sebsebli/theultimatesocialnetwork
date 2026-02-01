"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "./ui/toast";
import { renderMarkdown, stripLeadingH1IfMatch } from "@/utils/markdown";
import { getImageUrl } from "@/lib/security";
import { Avatar } from "./avatar";
import { ReplySection } from "./reply-section";
import { SourcesSection } from "./sources-section";
import { ReferencedBySection } from "./referenced-by-section";
import { OverflowMenu } from "./overflow-menu";
import { PublicSignInBar } from "./public-sign-in-bar";

interface PostDetailProps {
  post: {
    id: string;
    body: string;
    title?: string | null;
    createdAt: string;
    author: {
      id: string;
      handle: string;
      displayName: string;
      avatarKey?: string | null;
      avatarUrl?: string | null;
    };
    replyCount: number;
    quoteCount: number;
    privateLikeCount?: number;
    headerImageKey?: string | null;
    readingTimeMinutes?: number;
    referenceMetadata?: Record<string, { title?: string }>;
  };
  /** When true, viewer is not authenticated; hide actions and comments */
  isPublic?: boolean;
}

export function PostDetail({ post, isPublic = false }: PostDetailProps) {
  const { success: toastSuccess } = useToast();
  const [liked, setLiked] = useState(false);
  const [kept, setKept] = useState(false);

  useEffect(() => {
    // Load initial like/keep state if available
    if ((post as unknown as { isLiked?: boolean }).isLiked !== undefined) {
      setLiked(!!(post as unknown as { isLiked?: boolean }).isLiked);
    }
    if ((post as unknown as { isKept?: boolean }).isKept !== undefined) {
      setKept(!!(post as unknown as { isKept?: boolean }).isKept);
    }
  }, [post]);

  const handleLike = async () => {
    const previous = liked;
    setLiked(!previous); // Optimistic update

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: previous ? "DELETE" : "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }
    } catch {
      setLiked(previous); // Revert on error
    }
  };

  const handleKeep = async () => {
    const previous = kept;
    setKept(!previous); // Optimistic update

    try {
      const response = await fetch(`/api/posts/${post.id}/keep`, {
        method: previous ? "DELETE" : "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle keep");
      }
    } catch {
      setKept(previous); // Revert on error
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || "Post on Citewalk",
          text: `Check out this post by @${post.author.handle}`,
          url,
        });
      } catch {
        // ignore
      }
    } else {
      navigator.clipboard.writeText(url);
      toastSuccess("Link copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href={isPublic ? "/" : "/home"}
            className="text-secondary hover:text-paper"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <OverflowMenu
            postId={post.id}
            userId={post.author.id}
            isAuthor={false}
            onCopyLink={() => {
              const url = `${window.location.origin}/post/${post.id}`;
              navigator.clipboard.writeText(url);
              toastSuccess("Link copied to clipboard");
            }}
          />
        </div>
      </header>

      {/* Post Content */}
      <article className="px-5 py-6 border-b border-divider">
        {/* Author Meta */}
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/user/${post.author.handle}`}>
            <Avatar
              avatarKey={post.author.avatarKey}
              avatarUrl={post.author.avatarUrl}
              displayName={post.author.displayName}
              handle={post.author.handle}
              size="md"
            />
          </Link>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <Link href={`/user/${post.author.handle}`}>
                <span className="font-semibold text-sm text-paper hover:text-primary transition-colors">
                  {post.author.displayName}
                </span>
              </Link>
              <span className="text-tertiary text-xs">•</span>
              <span className="text-tertiary text-xs">
                {formatTime(post.createdAt)}
              </span>
              {post.readingTimeMinutes ? (
                <>
                  <span className="text-tertiary text-xs">•</span>
                  <span className="text-tertiary text-xs">
                    {post.readingTimeMinutes} min read
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mb-6">
          {post.title && (
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold leading-tight text-paper">
                {post.title}
              </h1>
              <Link
                href={`/post/${post.id}/reading`}
                className="text-primary text-sm font-medium hover:underline"
              >
                Reading mode
              </Link>
            </div>
          )}
          <div
            className="text-[18px] leading-relaxed text-secondary font-normal prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(stripLeadingH1IfMatch(post.body, post.title ?? undefined), {
                referenceMetadata: post.referenceMetadata ?? undefined,
              }),
            }}
          />
          {post.headerImageKey && (
            <div className="relative w-full aspect-video rounded-2xl bg-white/5 mt-4 overflow-hidden shadow-2xl">
              <Image
                src={getImageUrl(post.headerImageKey)}
                alt="Post header"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          )}
        </div>

        {/* Meta Row */}
        <div className="flex items-center gap-6 text-sm text-tertiary mb-6">
          {!isPublic && <span>{post.replyCount} replies</span>}
          <span>{post.quoteCount} quotes</span>
          {post.privateLikeCount && post.privateLikeCount > 0 && (
            <span>{post.privateLikeCount} likes</span>
          )}
        </div>

        {isPublic && (
          <p className="text-secondary text-sm pt-4 border-t border-divider">
            Sign in to like, reply, or comment.
          </p>
        )}

        {/* Actions */}
        {!isPublic && (
          <div className="flex items-center justify-between pt-4 border-t border-divider">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 hover:text-primary transition-colors ${liked ? "text-red-500" : "text-tertiary"}`}
            >
              <svg
                className={`w-5 h-5 ${liked ? "fill-current" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-sm">Like</span>
            </button>
            <button className="flex items-center gap-2 text-tertiary hover:text-primary transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-sm">Reply</span>
            </button>
            <Link href={`/compose?quote=${post.id}`}>
              <button className="flex items-center gap-2 text-tertiary hover:text-primary transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span className="text-sm">Quote</span>
              </button>
            </Link>
            <button
              onClick={handleKeep}
              className={`flex items-center gap-2 transition-colors ${kept ? "text-primary" : "text-tertiary hover:text-primary"}`}
            >
              <svg
                className="w-5 h-5"
                fill={kept ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <span className="text-sm">Keep</span>
            </button>
            <button className="flex items-center gap-2 text-tertiary hover:text-primary transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-sm">Add</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-tertiary hover:text-primary transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span className="text-sm">Share</span>
            </button>
          </div>
        )}
      </article>

      {/* Sections */}
      <div className={`px-5 py-6 space-y-8 ${isPublic ? "pb-24" : ""}`}>
        {/* Replies Section - always visible; shows "Sign in to comment" when not authenticated */}
        <ReplySection
          postId={post.id}
          replyCount={post.replyCount ?? 0}
          isPublic={isPublic}
        />

        {/* Sources Section */}
        <SourcesSection postId={post.id} />

        {/* Referenced by — only when post has been quoted */}
        {(post.quoteCount ?? 0) > 0 && (
          <ReferencedBySection postId={post.id} quoteCount={post.quoteCount ?? 0} />
        )}
      </div>

      {isPublic && (
        <PublicSignInBar message="Sign in to like, reply, and comment" />
      )}
    </div>
  );
}
