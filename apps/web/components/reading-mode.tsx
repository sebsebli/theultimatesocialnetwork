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
): string {
  const processed = stripLeadingH1IfMatch(text, titleToStrip ?? undefined);
  let html = renderMarkdown(processed, { referenceMetadata });
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
    };
    headerImageKey?: string | null;
    headerImageBlurhash?: string | null;
    referenceMetadata?: Record<string, { title?: string; deletedAt?: string }>;
    quoteCount: number;
    replyCount?: number;
    privateLikeCount?: number;
    isKept?: boolean;
    isLiked?: boolean;
    readingTimeMinutes?: number;
    viewerCanSeeContent?: boolean;
    deletedAt?: string;
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
      fetch(`/api/posts/${post.id}/view`, { method: "POST" }).catch(() => {});
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
        }).catch(() => {});
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
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
        <div className="max-w-[680px] mx-auto px-6 py-3 flex items-center justify-between gap-3">
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
      <article className="max-w-[680px] mx-auto px-6 py-10">
        {post.viewerCanSeeContent === false ? (
          <div className="min-h-[300px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center py-16">
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
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-paper">
                  {displayTitle}
                </h1>
              ) : null;
            })()}

            {/* Author & Date */}
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-divider">
              <Link href={`/user/${post.author.handle}`}>
                <Avatar
                  avatarKey={post.author.avatarKey}
                  avatarUrl={post.author.avatarUrl}
                  displayName={post.author.displayName}
                  handle={post.author.handle}
                  size="md"
                />
              </Link>
              <div>
                <Link href={`/user/${post.author.handle}`}>
                  <div className="font-semibold text-paper hover:text-primary transition-colors">
                    {post.author.displayName}
                  </div>
                </Link>
                <div className="text-tertiary text-sm flex items-center gap-2">
                  {formatDate(post.createdAt)}
                  {post.readingTimeMinutes != null &&
                    post.readingTimeMinutes > 0 && (
                      <span>· {post.readingTimeMinutes} min read</span>
                    )}
                </div>
              </div>
            </div>

            {/* Body with enhanced typography */}
            <div
              ref={bodyRef}
              className="prose prose-invert max-w-none text-[20px] md:text-[22px] leading-[1.7] text-secondary/90 tracking-normal font-serif"
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
                    );
                  })(),
                ),
              }}
            />

            {/* Action bar */}
            {!isPreview && (
              <div className="flex items-center justify-between gap-3 py-6 mt-8 border-t border-b border-divider flex-wrap">
                {/* Like */}
                {!isPublic && (
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 transition-colors ${liked ? "text-red-500" : "text-tertiary hover:text-primary"}`}
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
                )}

                {/* Reply */}
                <button
                  onClick={() => {
                    if (isPublic) {
                      window.location.href = "/sign-in";
                    } else {
                      const el = document.getElementById("reply");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="flex items-center gap-1.5 text-tertiary hover:text-primary transition-colors"
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
                  <span className="text-sm">
                    {post.replyCount ?? 0}{" "}
                    {(post.replyCount ?? 0) === 1 ? "reply" : "replies"}
                  </span>
                </button>

                {/* Quote */}
                {!isPublic ? (
                  <Link
                    href={`/compose?quote=${post.id}`}
                    className="flex items-center gap-1.5 text-tertiary hover:text-primary transition-colors"
                    aria-label="Quote post"
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
                    <span className="text-sm">
                      {(post.quoteCount ?? 0) > 0
                        ? `${post.quoteCount} cites`
                        : "Quote"}
                    </span>
                  </Link>
                ) : (
                  <span className="flex items-center gap-1.5 text-tertiary text-sm">
                    {(post.quoteCount ?? 0) > 0
                      ? `${post.quoteCount} cites`
                      : ""}
                  </span>
                )}

                {/* Share */}
                {!post.author?.isProtected && (
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-1.5 text-tertiary hover:text-primary transition-colors"
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
            )}

            {/* Connections: builds on, built upon by, topics */}
            {!isPreview &&
              post.viewerCanSeeContent !== false &&
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
