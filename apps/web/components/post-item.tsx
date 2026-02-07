import { useState, useMemo, memo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Blurhash } from "react-blurhash";
import { renderMarkdown, extractWikilinks } from "@/utils/markdown";
import { sanitizeHTML } from "@/lib/sanitize-html";
import { getImageUrl } from "@/lib/security";
import { getPostDisplayTitle } from "@/utils/compose-helpers";
import { Avatar } from "./avatar";
import { OverflowMenu } from "./overflow-menu";
import { AddToCollectionModal } from "./add-to-collection-modal";
import { ReportModal } from "./report-modal";
import { ShareModal } from "./share-modal";
import { useToast } from "./ui/toast";

export interface Post {
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
  replyCount: number;
  quoteCount: number;
  isLiked?: boolean;
  isKept?: boolean;
  privateLikeCount?: number;
  headerImageKey?: string | null;
  headerImageBlurhash?: string | null;
  referenceMetadata?: Record<string, { title?: string; deletedAt?: string }>;
  /** When false, content is redacted (e.g. FOLLOWERS-only and viewer doesn't follow); show private overlay */
  viewerCanSeeContent?: boolean;
  media?: { type: string; url: string };
}

export interface PostItemProps {
  post: Post;
  isAuthor?: boolean;
  isPublic?: boolean;
  /** When provided, called after successful un-keep so parent can remove from list (e.g. Keeps/Saved tab). */
  onKeep?: () => void;
  /** When provided, called after successful delete so parent can remove from list or redirect. */
  onDeleted?: () => void;
}

function PostItemInner({
  post,
  isAuthor = false,
  isPublic = false,
  onKeep,
  onDeleted,
}: PostItemProps) {
  const t = useTranslations("post");
  const tCommon = useTranslations("common");
  const { error: toastError } = useToast();
  const router = useRouter();
  const showPrivateOverlay = post.viewerCanSeeContent === false;
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [kept, setKept] = useState(post.isKept ?? false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLiked(post.isLiked ?? false);
    setKept(post.isKept ?? false);
  }, [post.id, post.isLiked, post.isKept]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPublic) {
      router.push("/sign-in");
      return;
    }
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 150);
    const previous = liked;
    setLiked(!previous);

    try {
      // Call Next.js API Route (BFF) which handles auth token (HttpOnly cookie)
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: previous ? "DELETE" : "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }
    } catch {
      setLiked(previous);
      toastError("Failed to update like");
    }
  };

  const handleKeep = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPublic) {
      router.push("/sign-in");
      return;
    }
    const previous = kept;
    setKept(!previous);

    try {
      const response = await fetch(`/api/posts/${post.id}/keep`, {
        method: previous ? "DELETE" : "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle keep");
      }
      if (previous) onKeep?.();
    } catch {
      setKept(previous);
      toastError("Failed to update save");
    }
  };

  const handleDelete = async () => {
    if (isPublic || !isAuthor || deleting) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to delete post");
      }
      onDeleted?.();
      router.push("/");
    } catch {
      toastError("Failed to delete post");
    } finally {
      setDeleting(false);
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

  const sources = useMemo(() => {
    const list: {
      type: string;
      title?: string;
      url?: string;
      id?: string;
      alias?: string;
      slug?: string;
    }[] = [];
    if (!post.body) return list;

    // External links: [text](url) or [url](text) (Cite format)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(post.body)) !== null) {
      const a = (match[1] ?? "").trim();
      const b = (match[2] ?? "").trim();
      const isUrl = (s: string) =>
        s.startsWith("http://") || s.startsWith("https://");
      const url = isUrl(b) ? b : isUrl(a) ? a : null;
      const title = isUrl(b) ? a : isUrl(a) ? b : null;
      if (url) list.push({ type: "external", title: title ?? undefined, url });
    }

    // Wikilinks
    const wikilinks = extractWikilinks(post.body);
    wikilinks.forEach(({ target }) => {
      if (target.type === "post") {
        list.push({
          type: "post",
          id: target.target,
          title: target.alias || "Referenced Post",
        });
      } else if (target.type === "topic") {
        list.push({
          type: "topic",
          title: target.target,
          alias: target.alias,
          slug: target.target.toLowerCase().replace(/[^\w\-]+/g, "-"),
        });
      }
    });

    return list;
  }, [post.body]);

  return (
    <article className="flex flex-col gap-3 px-5 md:px-6 py-6 border-b border-divider bg-ink">
      {/* Author Meta */}
      <Link
        href={`/user/${post.author.handle}`}
        className="flex items-center gap-3"
      >
        <Avatar
          avatarKey={post.author.avatarKey}
          avatarUrl={post.author.avatarUrl}
          displayName={post.author.displayName}
          handle={post.author.handle}
          size="md"
        />
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-paper">
            {post.author.displayName}
          </span>
          <span className="text-tertiary text-xs">•</span>
          <span className="text-tertiary text-xs font-mono">
            {formatTime(post.createdAt)}
          </span>
        </div>
      </Link>

      {/* Content */}
      <Link
        href={`/post/${post.id}/reading`}
        className="flex flex-col gap-2 cursor-pointer group"
      >
        <div className="relative">
          {showPrivateOverlay ? (
            <>
              <div className="min-h-[120px] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-tertiary">
                  <svg
                    className="w-10 h-10"
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
                  <span className="text-sm font-semibold text-paper">
                    {tCommon("private")}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {(() => {
                const displayTitle = getPostDisplayTitle(post);
                return displayTitle ? (
                  <h2 className="text-xl font-bold leading-tight tracking-tight text-paper group-hover:text-primary transition-colors duration-200 mb-1">
                    {displayTitle}
                  </h2>
                ) : null;
              })()}
              <div className="relative max-h-[20rem] overflow-hidden mt-1">
                <div
                  className="prose prose-invert max-w-none text-[17px] leading-relaxed text-secondary font-normal transition-colors duration-200 group-hover:text-gray-300"
                  dangerouslySetInnerHTML={{
                    // Safe: Content is sanitized HTML from renderMarkdown which processes user markdown
                    // and escapes dangerous content. Additional DOMPurify sanitization ensures XSS protection.
                    __html: sanitizeHTML(
                      renderMarkdown(post.body, {
                        referenceMetadata: post.referenceMetadata,
                      }),
                    ),
                  }}
                />
                {post.body.length > 300 && (
                  <div
                    className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-ink via-ink/80 to-transparent"
                    aria-hidden
                  />
                )}
              </div>
              {post.headerImageKey && (
                <div className="relative w-full h-[240px] rounded-lg bg-divider mt-4 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300">
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
                    alt="Post header"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105 z-10"
                    sizes="(max-width: 768px) 100vw, 680px"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Render Rich Media (GIF/Video) - only when content visible */}
        {!showPrivateOverlay && post.media && (
          <div
            className="mb-3 rounded-lg overflow-hidden relative w-full bg-black mt-4"
            onClick={(e) => e.preventDefault()}
          >
            {post.media.type === "video" ? (
              <video
                src={post.media.url}
                controls
                className="w-full max-h-[500px]"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.media.url}
                alt="Post media"
                className="w-full h-auto object-contain"
              />
            )}
          </div>
        )}
      </Link>

      {/* Sources Section - hide when private */}
      {!showPrivateOverlay && sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-divider/50">
          <h4 className="text-[11px] font-semibold text-tertiary uppercase tracking-wider mb-2">
            Sources & References
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sources.map((source, i) => (
              <Link
                key={i}
                href={
                  source.type === "external"
                    ? (source.url ?? "#")
                    : source.type === "post"
                      ? `/post/${source.id ?? ""}`
                      : `/topic/${encodeURIComponent(source.slug ?? source.title ?? source.id ?? "")}`
                }
                target={source.type === "external" ? "_blank" : undefined}
                rel={
                  source.type === "external" ? "noopener noreferrer" : undefined
                }
                className="flex items-center gap-3 p-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group/source"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-7 h-7 rounded-full bg-divider flex items-center justify-center text-secondary group-hover/source:text-primary transition-colors shrink-0">
                  {source.type === "external" && (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  )}
                  {source.type === "post" && (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                  {source.type === "topic" && (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-tertiary font-medium">
                    {source.type === "external"
                      ? new URL(source.url || "http://x").hostname
                      : source.type === "topic"
                        ? "Topic"
                        : "Post"}
                  </span>
                  <span className="text-sm text-paper font-semibold truncate">
                    {source.alias || source.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Private Like Feedback (Author Only) */}
      {isAuthor && post.privateLikeCount && post.privateLikeCount > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          <svg
            className="w-3.5 h-3.5 text-tertiary"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <p className="text-[13px] font-medium text-tertiary">
            {t("privateLike", { count: post.privateLikeCount })}
          </p>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between pt-2 pr-4 text-tertiary">
        <button
          type="button"
          onClick={handleLike}
          aria-label={liked ? t("liked") : t("like")}
          className={`flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:text-primary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${liked ? "text-like" : ""}`}
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
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isPublic) {
              router.push("/sign-in");
            } else {
              router.push(`/post/${post.id}#reply`);
            }
          }}
          aria-label={
            post.replyCount > 0
              ? `${post.replyCount} ${t("replies")}`
              : t("reply")
          }
          className="flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
          {post.replyCount > 0 && (
            <span className="text-xs">{post.replyCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isPublic) {
              router.push("/sign-in");
            } else {
              router.push(`/compose?quote=${post.id}`);
            }
          }}
          aria-label={
            post.quoteCount > 0
              ? `${post.quoteCount} ${t("quotes")}`
              : t("quote")
          }
          className="flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
          </svg>
          {post.quoteCount > 0 && (
            <span className="text-xs">{post.quoteCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={handleKeep}
          aria-label={kept ? t("kept") : t("keep")}
          className={`flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${kept ? "text-primary" : ""}`}
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
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isPublic) {
              router.push("/sign-in");
              return;
            }
            setShowCollectionModal(true);
          }}
          aria-label="Add to collection"
          className="flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        {!post.author?.isProtected && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowShareModal(true);
            }}
            aria-label="Share post"
            className="flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
          </button>
        )}
        <OverflowMenu
          postId={post.id}
          userId={post.author.id ?? post.author.handle}
          userHandle={post.author.handle}
          isAuthor={isAuthor}
          onReport={() => setShowReportModal(true)}
          onDelete={isAuthor && !isPublic ? handleDelete : undefined}
          onCopyLink={
            !post.author?.isProtected
              ? () => {
                  const url = `${window.location.origin}/post/${post.id}`;
                  navigator.clipboard.writeText(url);
                }
              : undefined
          }
        />
      </div>

      <AddToCollectionModal
        postId={post.id}
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
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
    </article>
  );
}

export const PostItem = memo(PostItemInner);
