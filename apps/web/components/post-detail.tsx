"use client";

import { useState, useEffect, memo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useToast } from "./ui/toast";
import { renderMarkdown, stripLeadingH1IfMatch } from "@/utils/markdown";
import { sanitizeHTML } from "@/lib/sanitize-html";
import { getImageUrl } from "@/lib/security";
import { hydrateMentionAvatars } from "@/utils/hydrate-mentions";
import { getPostDisplayTitle } from "@/utils/compose-helpers";
import { Avatar } from "./avatar";
import { ReplySection } from "./reply-section";
import { PostConnections } from "./post-connections";
import { OverflowMenu } from "./overflow-menu";
import { AddToCollectionModal } from "./add-to-collection-modal";
import { ReportModal } from "./report-modal";
import { ShareModal } from "./share-modal";
import { PublicSignInBar } from "./public-sign-in-bar";
import { useAuth } from "./auth-provider";
import { useExplorationTrail } from "@/context/exploration-trail";

export interface PostDetailProps {
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
      isProtected?: boolean;
    };
    replyCount: number;
    quoteCount: number;
    privateLikeCount?: number;
    headerImageKey?: string | null;
    readingTimeMinutes?: number;
    contentWarning?: string | null;
    referenceMetadata?: Record<string, { title?: string; deletedAt?: string }>;
    /** When set, post was soft-deleted; show "deleted on ..." placeholder */
    deletedAt?: string;
    /** When false, content is redacted (FOLLOWERS-only and viewer doesn't follow); show private message */
    viewerCanSeeContent?: boolean;
  };
  /** When true, viewer is not authenticated; hide actions and comments */
  isPublic?: boolean;
  /** When set, scroll to and highlight this reply (e.g. from notification link) */
  highlightReplyId?: string | null;
}

function PostDetailInner({
  post,
  isPublic = false,
  highlightReplyId,
}: PostDetailProps) {
  const t = useTranslations("post");
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const { user } = useAuth();
  const { pushStep } = useExplorationTrail();
  const [liked, setLiked] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [kept, setKept] = useState(false);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const bodyRef = useRef<HTMLDivElement>(null);

  const isAuthor = !!user && user.id === post.author.id;

  useEffect(() => {
    // Load initial like/keep state if available
    if ((post as unknown as { isLiked?: boolean }).isLiked !== undefined) {
      setLiked(!!(post as unknown as { isLiked?: boolean }).isLiked);
    }
    if ((post as unknown as { isKept?: boolean }).isKept !== undefined) {
      setKept(!!(post as unknown as { isKept?: boolean }).isKept);
    }
  }, [post]);

  useEffect(() => {
    // Track view on mount
    if (!isPublic) {
      fetch(`/api/posts/${post.id}/view`, { method: "POST" }).catch(() => {
        /* view tracking best-effort */
      });
    }

    // Track read time on unmount
    startTimeRef.current = Date.now();
    return () => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (duration > 5 && !isPublic) {
        fetch(`/api/posts/${post.id}/read-time`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration }),
          keepalive: true, // Ensure request sends even if navigating away
        }).catch(() => {
          /* read-time tracking best-effort */
        });
      }
    };
  }, [post.id, isPublic]);

  // Push trail step when post loads
  useEffect(() => {
    const title =
      getPostDisplayTitle(post) || post.body?.slice(0, 40) || "Post";
    pushStep({
      type: "post",
      id: post.id,
      label: title,
      href: `/post/${post.id}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]); // Only on post ID change

  // Hydrate @mention avatars
  useEffect(() => {
    hydrateMentionAvatars(bodyRef.current);
  }, [post.body]);

  // Scroll to reply section when navigating with #reply (e.g. from post preview "comments" link)
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#reply")
      return;
    const el = document.getElementById("reply");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleLike = async () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 150);
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
      setLiked(previous);
      toastError("Failed to update like");
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
      setKept(previous);
      toastError("Failed to update save");
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 30) return `${days}d`;
    if (months < 12) return `${months}mo`;
    return `${years}y`;
  };

  const handleShare = async () => {
    setShowShareModal(true);
  };

  const handleDelete = async () => {
    if (isPublic || !isAuthor || deleting) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to delete post");
      }
      router.push("/");
    } catch {
      toastError("Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  const showPrivateContent = post.viewerCanSeeContent !== false;

  if (post.deletedAt) {
    const deletedDate = new Date(post.deletedAt);
    const formattedDate = deletedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href={isPublic ? "/" : "/home"}
              className="text-secondary hover:text-paper"
              aria-label="Back"
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
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center max-w-md">
            <div className="mb-4 text-tertiary">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <p className="text-paper font-medium mb-2">
              This post has been deleted
            </p>
            <p className="text-secondary text-sm mb-6">
              It was deleted on {formattedDate}.
            </p>
            <Link
              href={isPublic ? "/" : "/home"}
              className="text-primary hover:underline font-medium"
            >
              Go back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href={isPublic ? "/" : "/home"}
            className="text-secondary hover:text-paper"
            aria-label="Back"
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
            userHandle={post.author.handle}
            isAuthor={isAuthor}
            onReport={() => setShowReportModal(true)}
            onDelete={isAuthor && !isPublic ? handleDelete : undefined}
            onCopyLink={
              !post.author?.isProtected
                ? () => {
                  const url = `${window.location.origin}/post/${post.id}`;
                  navigator.clipboard.writeText(url);
                  toastSuccess("Link copied to clipboard");
                }
                : undefined
            }
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
                  <span className="text-tertiary text-xs inline-flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-60"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {post.readingTimeMinutes} min
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mb-6">
          {!showPrivateContent ? (
            <div className="min-h-[200px] border border-divider flex flex-col items-center justify-center py-12 px-4">
              <div className="flex flex-col items-center gap-3 text-tertiary">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <p className="text-paper font-medium">
                  This post is only visible to followers
                </p>
                <p className="text-sm text-secondary text-center">
                  Follow the author to see the full content.
                </p>
              </div>
              <Link
                href={`/user/${post.author.handle}`}
                className="mt-6 flex items-center gap-3 w-full max-w-md p-3 border-b border-divider hover:bg-white/5 transition-colors"
              >
                <Avatar
                  avatarKey={post.author.avatarKey}
                  avatarUrl={post.author.avatarUrl}
                  displayName={post.author.displayName}
                  handle={post.author.handle}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-paper truncate">
                    {post.author.displayName}
                  </p>
                  <p className="text-sm text-tertiary truncate">
                    @{post.author.handle}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary shrink-0">
                  Follow
                </span>
              </Link>
            </div>
          ) : (
            <>
              {post.contentWarning && (
                <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-lg border text-sm" style={{ backgroundColor: "rgba(245,166,35,0.08)", borderColor: "rgba(245,166,35,0.25)", color: "rgba(245,166,35,0.9)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
                  {post.contentWarning}
                </div>
              )}
              {(() => {
                const displayTitle = getPostDisplayTitle(post);
                return displayTitle ? (
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold leading-tight text-paper">
                      {displayTitle}
                    </h1>
                    <Link
                      href={`/post/${post.id}/reading`}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      Reading mode
                    </Link>
                  </div>
                ) : null;
              })()}
              <div
                ref={bodyRef}
                className="text-[18px] leading-relaxed text-secondary font-normal prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  // Safe: Content is sanitized HTML from renderMarkdown which processes user markdown
                  // and escapes dangerous content. Additional DOMPurify sanitization ensures XSS protection.
                  __html: sanitizeHTML(
                    renderMarkdown(
                      stripLeadingH1IfMatch(
                        post.body,
                        (post.title ?? getPostDisplayTitle(post)) || undefined,
                      ),
                      {
                        referenceMetadata: post.referenceMetadata ?? undefined,
                      },
                    ),
                  ),
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
            </>
          )}
        </div>

        {/* Meta Row */}
        <div className="flex items-center gap-6 text-sm text-tertiary mb-6">
          {!isPublic && (
            <span>
              {post.replyCount}{" "}
              {post.replyCount === 1 ? t("comment") : t("comments")}
            </span>
          )}
          {(post.quoteCount ?? 0) > 0 ? (
            <Link
              href={`/post/${post.id}/quotes`}
              className="hover:text-primary transition-colors"
            >
              {post.quoteCount} cites
            </Link>
          ) : (
            <span>{post.quoteCount} cites</span>
          )}
          {post.privateLikeCount && post.privateLikeCount > 0 && (
            <span>{post.privateLikeCount} likes</span>
          )}
        </div>

        {/* Actions — order matches mobile: Read, Reply, Quote, Like, Keep, Add, Share */}
        <div className="flex items-center justify-between pt-4 border-t border-divider flex-wrap gap-2">
          <Link
            href={`/post/${post.id}/reading`}
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-sm">{t("readArticle")}</span>
          </Link>
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 hover:text-primary transition-colors duration-200 ${liked ? "text-red-500" : "text-tertiary"}`}
            aria-label={liked ? "Unlike post" : "Like post"}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-150 ${likeAnimating ? "scale-125" : "scale-100"} ${liked ? "fill-current" : ""}`}
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
          <button
            onClick={() => {
              if (isPublic) window.location.href = "/sign-in";
              else {
                const el = document.getElementById("reply");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="flex items-center gap-2 text-tertiary hover:text-primary transition-colors"
            aria-label="Reply to post"
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm">Reply</span>
          </button>
          <button
            onClick={() => {
              if (isPublic) window.location.href = "/sign-in";
              // Link will handle nav if not public, but we need to intercept
            }}
            className="flex items-center gap-2 text-tertiary hover:text-primary transition-colors"
            aria-label="Quote post"
          >
            {isPublic ? (
              <div className="flex items-center gap-2">
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
              </div>
            ) : (
              <Link
                href={`/compose?quote=${post.id}`}
                className="flex items-center gap-2"
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
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span className="text-sm">Quote</span>
              </Link>
            )}
          </button>
          <button
            onClick={handleKeep}
            className={`flex items-center gap-2 transition-colors ${kept ? "text-primary" : "text-tertiary hover:text-primary"}`}
            aria-label={kept ? "Remove from saved" : "Save post"}
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
          <button
            onClick={() => {
              if (isPublic) window.location.href = "/sign-in";
              else setShowAddToCollection(true);
            }}
            className="flex items-center gap-2 text-tertiary hover:text-primary transition-colors"
            aria-label="Add to collection"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm">Add</span>
          </button>
          {!post.author?.isProtected && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-tertiary hover:text-primary transition-colors"
              aria-label="Share post"
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
          )}
        </div>
      </article>

      {/* Connections – replaces tabs */}
      {showPrivateContent && (
        <PostConnections
          postId={post.id}
          postBody={post.body}
          quoteCount={post.quoteCount ?? 0}
        />
      )}

      {/* Replies Section - id for #reply hash; scroll-into-view handled below */}
      <div className={`px-5 py-6 ${isPublic ? "pb-24" : ""}`}>
        <section id="reply" aria-label="Replies">
          <ReplySection
            postId={post.id}
            replyCount={post.replyCount ?? 0}
            isPublic={isPublic}
            highlightReplyId={highlightReplyId}
          />
        </section>
      </div>

      {isPublic && (
        <PublicSignInBar message="Sign in to like, reply, and comment" />
      )}

      <AddToCollectionModal
        postId={post.id}
        isOpen={showAddToCollection}
        onClose={() => setShowAddToCollection(false)}
      />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetId={post.id}
        targetType="POST"
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={`${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`}
        title={post.title || undefined}
        authorIsProtected={post.author?.isProtected}
      />
    </div>
  );
}

export const PostDetail = memo(PostDetailInner);
