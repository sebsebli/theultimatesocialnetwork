"use client";

import { memo, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Blurhash } from "react-blurhash";
import { getImageUrl } from "@/lib/security";
import { Avatar } from "./avatar";
import { OfflineToggle } from "./offline-toggle";
import { useToast } from "./ui/toast";
import { PostConnections } from "./post-connections";
import { ReplySection } from "./reply-section";
import { OverflowMenu } from "./overflow-menu";
import { AddToCollectionModal } from "./add-to-collection-modal";
import { ReportModal } from "./report-modal";
import { ShareModal } from "./share-modal";
import {
  ActionButton,
  HeartIcon,
  CommentIcon,
  QuoteIcon,
  BookmarkIcon,
  AddCircleIcon,
  ShareIcon,
} from "./ui/action-button";
import { renderMarkdown, stripLeadingH1IfMatch } from "@/utils/markdown";
import { sanitizeHTML } from "@/lib/sanitize-html";
import { getPostDisplayTitle } from "@/utils/compose-helpers";
import { hydrateMentionAvatars } from "@/utils/hydrate-mentions";
import { useExplorationTrail } from "@/context/exploration-trail";
import { useAuth } from "./auth-provider";

function renderMarkdownForReading(
  text: string,
  titleToStrip?: string | null,
  referenceMetadata?: Record<string, { title?: string; deletedAt?: string }>,
  inlineEnrichment?: {
    mentionAvatars?: Record<string, string | null>;
    topicPostCounts?: Record<string, number>;
    postCiteCounts?: Record<string, number>;
  } | null,
): string {
  const processed = stripLeadingH1IfMatch(text, titleToStrip ?? undefined);
  let html = renderMarkdown(processed, {
    referenceMetadata,
    inlineEnrichment,
  });
  html = html.replace(
    /class="prose-heading prose-h3 text-base font-semibold/g,
    'class="prose-heading prose-h3 text-xl font-semibold font-sans tracking-tight',
  );
  html = html.replace(
    /class="prose-heading prose-h2 text-lg font-semibold/g,
    'class="prose-heading prose-h2 text-3xl font-semibold font-sans tracking-tighter',
  );
  html = html.replace(
    /class="prose-heading prose-h1 text-xl font-bold/g,
    'class="prose-heading prose-h1 text-4xl font-bold font-sans tracking-tighter',
  );
  html = html.replace(
    /class="(prose-tag[^"]*)"/g,
    (_, cls: string) =>
      `class="${cls} border-b border-current border-opacity-40 pb-0.5 font-serif font-semibold"`,
  );
  html = html.replace(
    /<blockquote>/g,
    '<blockquote class="border-l-4 border-primary/50 bg-white/5 pl-6 pr-4 py-4 my-8 rounded-r-lg text-xl italic text-secondary font-serif">',
  );
  html = html.replace(
    /<ul>/g,
    '<ul class="list-disc pl-6 space-y-3 my-6 marker:text-tertiary font-serif">',
  );
  html = html.replace(
    /<ol>/g,
    '<ol class="list-decimal pl-6 space-y-3 my-6 marker:text-tertiary font-serif">',
  );
  html = html.replace(/<li>/g, '<li class="pl-2">');
  html = html
    .split("<br /><br />")
    .map((para) => {
      if (para.trim() && !para.match(/^<[h|b|u|o]/)) {
        return `<p class="mb-6">${para}</p>`;
      }
      return para;
    })
    .join("");
  return html;
}

export interface ReadingModeProps {
  post: {
    id: string;
    body: string;
    title?: string | null;
    createdAt: string;
    author: {
      id?: string;
      handle: string;
      displayName: string;
      avatarKey?: string | null;
      avatarUrl?: string | null;
      isProtected?: boolean;
      bio?: string | null;
    };
    headerImageKey?: string | null;
    headerImageBlurhash?: string | null;
    referenceMetadata?: Record<string, { title?: string; deletedAt?: string }>;
    inlineEnrichment?: {
      mentionAvatars?: Record<string, string | null>;
      topicPostCounts?: Record<string, number>;
      postCiteCounts?: Record<string, number>;
    } | null;
    quoteCount: number;
    replyCount?: number;
    privateLikeCount?: number;
    isKept?: boolean;
    isLiked?: boolean;
    readingTimeMinutes?: number;
    viewerCanSeeContent?: boolean;
    deletedAt?: string;
    contentWarning?: string | null;
  };
  /** Called when user unkeeps the post (e.g. to refresh Keeps list). */
  onKeep?: () => void;
  /** When true, hide actions/replies (e.g. public view, composer preview). */
  isPublic?: boolean;
  /** When true, this is a composer preview – skip view tracking, connections, replies. */
  isPreview?: boolean;
}

function ReadingModeInner({
  post,
  onKeep,
  isPublic = false,
  isPreview = false,
}: ReadingModeProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const { user } = useAuth();
  const { pushStep } = useExplorationTrail();
  const [kept, setKept] = useState(post.isKept ?? false);
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  const isAuthor = !!user && !!post.author.id && user.id === post.author.id;

  useEffect(() => {
    setKept(post.isKept ?? false);
    setLiked(post.isLiked ?? false);
  }, [post.id, post.isKept, post.isLiked]);

  // Track view when opening
  useEffect(() => {
    if (isPreview || isPublic) return;
    if (post.id && post.id !== "preview") {
      fetch(`/api/posts/${post.id}/view`, { method: "POST" }).catch(() => { });
    }
    // Track read time on unmount
    startTimeRef.current = Date.now();
    return () => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (duration > 5 && post.id && post.id !== "preview") {
        fetch(`/api/posts/${post.id}/read-time`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration }),
          keepalive: true,
        }).catch(() => { });
      }
    };
  }, [post.id, isPublic, isPreview]);

  // Push trail step
  useEffect(() => {
    if (isPreview) return;
    const title =
      getPostDisplayTitle(post) || post.body?.slice(0, 40) || "Post";
    pushStep({
      type: "post",
      id: post.id,
      label: title,
      href: `/post/${post.id}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  // Hydrate @mention avatars after render
  useEffect(() => {
    hydrateMentionAvatars(bodyRef.current);
  }, [post.body]);

  // Scroll to reply section when navigating with #reply
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#reply")
      return;
    const el = document.getElementById("reply");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleKeep = useCallback(async () => {
    const previous = kept;
    setKept(!previous);
    try {
      const res = await fetch(`/api/posts/${post.id}/keep`, {
        method: previous ? "DELETE" : "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle keep");
      if (previous) onKeep?.();
    } catch {
      setKept(previous);
      toastError("Failed to update save");
    }
  }, [kept, post.id, onKeep, toastError]);

  const handleLike = useCallback(async () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 150);
    const previous = liked;
    setLiked(!previous);
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: previous ? "DELETE" : "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to toggle like");
    } catch {
      setLiked(previous);
      toastError("Failed to update like");
    }
  }, [liked, post.id, toastError]);

  const handleDelete = useCallback(async () => {
    if (isPublic || !isAuthor || deleting) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete post");
      if (typeof window !== "undefined") window.location.href = "/home";
    } catch {
      toastError("Failed to delete post");
    } finally {
      setDeleting(false);
    }
  }, [isPublic, isAuthor, deleting, post.id, toastError]);

  const formatDate = (date: string) => {
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

  if (post.deletedAt) {
    const deletedDate = new Date(post.deletedAt);
    const formattedDate = deletedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center max-w-md">
          <div className="mb-4 text-tertiary">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
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
            href="/home"
            className="text-primary hover:underline font-medium"
          >
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-ink/95 backdrop-blur-md border-b border-divider">
        <div className="max-w-[680px] mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <Link
            href={isPublic ? "/" : "/home"}
            className="text-secondary hover:text-paper flex items-center gap-2"
            aria-label="Back"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          {post.title && (
            <h1 className="text-sm font-semibold text-paper truncate max-w-[50%] opacity-80">
              {post.title}
            </h1>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {!isPreview && !isPublic && (
              <>
                <button
                  type="button"
                  onClick={handleKeep}
                  aria-label={kept ? "Saved" : "Save"}
                  className={`flex items-center justify-center min-h-[36px] min-w-[36px] rounded-lg transition-colors ${kept ? "text-primary" : "text-tertiary hover:text-paper"}`}
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
                </button>
                <OfflineToggle post={post} />
                <OverflowMenu
                  postId={post.id}
                  userId={post.author.id || ""}
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-[680px] mx-auto px-4 py-6">
        {post.viewerCanSeeContent === false ? (
          <div className="min-h-[300px] border border-divider flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-tertiary text-center px-4">
              <svg
                className="w-14 h-14"
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
              <p className="text-sm text-secondary">
                Follow the author to see the full content.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header Image */}
            {post.headerImageKey && (
              <div className="relative w-full aspect-video mb-8 rounded-xl overflow-hidden bg-divider shadow-sm">
                {post.headerImageBlurhash && (
                  <Blurhash
                    hash={post.headerImageBlurhash}
                    width={32}
                    height={32}
                    punch={1}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  />
                )}
                <Image
                  src={getImageUrl(post.headerImageKey)}
                  alt={getPostDisplayTitle(post) || "Post header"}
                  fill
                  className="object-cover z-10"
                  sizes="(max-width: 768px) 100vw, 680px"
                  priority
                />
              </div>
            )}

            {/* Title */}
            {(() => {
              const displayTitle = getPostDisplayTitle(post);
              return displayTitle ? (
                <h1 className="text-[28px] font-bold leading-[36px] tracking-[-0.5px] mb-6 text-paper">
                  {displayTitle}
                </h1>
              ) : null;
            })()}

            {/* Author & Date — matches mobile PostAuthorHeader "full" variant */}
            <Link
              href={`/user/${post.author.handle}`}
              className="flex items-center gap-3 mb-8 pb-6 border-b border-divider group"
            >
              <Avatar
                avatarKey={post.author.avatarKey}
                avatarUrl={post.author.avatarUrl}
                displayName={post.author.displayName}
                handle={post.author.handle}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[15px] text-paper group-hover:text-primary transition-colors">
                    {post.author.displayName}
                  </span>
                  {post.readingTimeMinutes != null &&
                    post.readingTimeMinutes > 0 && (
                      <>
                        <span className="text-tertiary text-xs">·</span>
                        <span className="text-secondary text-xs inline-flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-60"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          {post.readingTimeMinutes} min
                        </span>
                      </>
                    )}
                </div>
                <div className="text-tertiary text-[13px] mt-0.5">
                  {formatDate(post.createdAt)}
                </div>
                {post.author.bio && (
                  <div className="text-secondary text-xs mt-0.5 line-clamp-2 leading-4">
                    {post.author.bio}
                  </div>
                )}
              </div>
            </Link>

            {/* Content warning banner */}
            {post.contentWarning && (
              <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-lg border text-sm" style={{ backgroundColor: "rgba(245,166,35,0.08)", borderColor: "rgba(245,166,35,0.25)", color: "rgba(245,166,35,0.9)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
                {post.contentWarning}
              </div>
            )}

            {/* Body with enhanced typography */}
            <div
              ref={bodyRef}
              className="prose prose-invert max-w-none text-[17px] leading-relaxed text-secondary/90 tracking-normal font-serif"
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
              }}
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(
                  (() => {
                    const displayTitle = getPostDisplayTitle(post);
                    const body =
                      post.title != null && post.title !== ""
                        ? stripLeadingH1IfMatch(
                          post.body,
                          post.title ?? undefined,
                        )
                        : displayTitle
                          ? (() => {
                            const first =
                              post.body.split("\n")[0]?.trim() ?? "";
                            if (
                              first === "# " + displayTitle ||
                              first === "#" + displayTitle
                            )
                              return stripLeadingH1IfMatch(
                                post.body,
                                displayTitle,
                              );
                            return post.body.includes("\n")
                              ? post.body
                                .slice(post.body.indexOf("\n") + 1)
                                .trimStart()
                              : "";
                          })()
                          : post.body;
                    return renderMarkdownForReading(
                      body,
                      null,
                      post.referenceMetadata,
                      post.inlineEnrichment,
                    );
                  })(),
                ),
              }}
            />

            {/* Action bar — matches mobile exactly: like, reply, quote, save, collection, share */}
            {!isPreview && (
              <div className="flex items-center justify-between pt-2 pr-4 mt-8 border-t border-divider">
                {!isPublic && (
                  <ActionButton
                    onClick={(e) => {
                      e.preventDefault();
                      handleLike();
                    }}
                    aria-label={liked ? "Unlike post" : "Like post"}
                    active={liked}
                    activeColor="text-like"
                    icon={<HeartIcon />}
                    activeIcon={<HeartIcon filled />}
                  />
                )}

                <ActionButton
                  onClick={(e) => {
                    e.preventDefault();
                    if (isPublic) {
                      window.location.href = "/sign-in";
                    } else {
                      const el = document.getElementById("reply");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  aria-label="Reply to post"
                  icon={<CommentIcon />}
                  count={post.replyCount ?? 0}
                />

                {!isPublic ? (
                  <ActionButton
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/compose?quote=${post.id}`;
                    }}
                    aria-label="Quote post"
                    icon={<QuoteIcon />}
                    count={post.quoteCount ?? 0}
                  />
                ) : (
                  <ActionButton
                    onClick={() => { }}
                    aria-label="Quote post"
                    icon={<QuoteIcon />}
                    count={post.quoteCount ?? 0}
                    disabled
                  />
                )}

                {!isPublic && (
                  <ActionButton
                    onClick={(e) => {
                      e.preventDefault();
                      handleKeep();
                    }}
                    aria-label={kept ? "Saved" : "Save"}
                    active={kept}
                    icon={<BookmarkIcon />}
                    activeIcon={<BookmarkIcon filled />}
                  />
                )}

                {!isPublic && (
                  <ActionButton
                    onClick={(e) => {
                      e.preventDefault();
                      setShowAddToCollection(true);
                    }}
                    aria-label="Add to collection"
                    icon={<AddCircleIcon />}
                  />
                )}

                {!post.author?.isProtected && (
                  <ActionButton
                    onClick={(e) => {
                      e.preventDefault();
                      setShowShareModal(true);
                    }}
                    aria-label="Share post"
                    icon={<ShareIcon />}
                  />
                )}
              </div>
            )}

            {/* Connections: builds on, built upon by, topics */}
            {!isPreview &&
              (post.viewerCanSeeContent as boolean | undefined) !== false &&
              post.id &&
              post.id !== "preview" && (
                <div className="mt-2">
                  <PostConnections
                    postId={post.id}
                    postBody={post.body}
                    quoteCount={post.quoteCount ?? 0}
                  />
                </div>
              )}

            {/* Replies */}
            {!isPreview && !isPublic && (
              <div className="mt-8 pt-6">
                <section id="reply" aria-label="Replies">
                  <ReplySection
                    postId={post.id}
                    replyCount={post.replyCount ?? 0}
                    isPublic={isPublic}
                  />
                </section>
              </div>
            )}
          </>
        )}
      </article>

      {/* Modals */}
      {!isPreview && !isPublic && (
        <>
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
        </>
      )}
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

export const ReadingMode = memo(ReadingModeInner);
