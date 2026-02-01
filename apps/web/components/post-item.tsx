"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Blurhash } from "react-blurhash";
import { useTranslations } from "next-intl";
import { renderMarkdown, extractWikilinks, stripLeadingH1IfMatch, bodyToPlainExcerpt } from "@/utils/markdown";
import { getImageUrl } from "@/lib/security";
import { Avatar } from "./avatar";
import { OverflowMenu } from "./overflow-menu";
import { AddToCollectionModal } from "./add-to-collection-modal";

export interface Post {
  id: string;
  title?: string;
  body: string;
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
  headerImageKey?: string;
  headerImageBlurhash?: string;
  isLiked?: boolean;
  isKept?: boolean;
  referenceMetadata?: Record<string, { title?: string }>;
}

interface PostItemProps {
  post: Post;
  isAuthor?: boolean;
}

export function PostItem({ post, isAuthor = false }: PostItemProps) {
  const t = useTranslations("post");
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [kept, setKept] = useState(post.isKept ?? false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    }
  };

  const handleKeep = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const previous = kept;
    setKept(!previous);

    try {
      const response = await fetch(`/api/posts/${post.id}/keep`, {
        method: previous ? "DELETE" : "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle keep");
      }
    } catch {
      setKept(previous);
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

    // External links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(post.body)) !== null) {
      if (match[2].startsWith("http")) {
        list.push({ type: "external", title: match[1], url: match[2] });
      }
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
          <span className="text-tertiary text-xs">
            {formatTime(post.createdAt)}
          </span>
        </div>
      </Link>

      {/* Content */}
      <Link
        href={post.title ? `/post/${post.id}/reading` : `/post/${post.id}`}
        className="flex flex-col gap-2 cursor-pointer group"
      >
        {post.title && (
          <h2 className="text-xl font-bold leading-tight tracking-tight text-paper group-hover:text-primary transition-colors duration-200">
            {post.title}
          </h2>
        )}
        <p className="text-[17px] leading-relaxed text-secondary font-normal transition-colors duration-200 group-hover:text-gray-300 whitespace-nowrap overflow-hidden">
          {bodyToPlainExcerpt(post.body, post.title ?? undefined, 120)}
        </p>
        {post.headerImageKey && (
          <div className="relative w-full h-[240px] rounded-xl bg-divider mt-4 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300">
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
      </Link>

      {/* Sources Section */}
      {sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-divider/50">
          <h4 className="text-[11px] font-semibold text-tertiary uppercase tracking-wider mb-2">
            Sources & References
          </h4>
          <div className="flex flex-col gap-2">
            {sources.map((source, i) => (
              <Link
                key={i}
                href={
                  source.type === "external"
                    ? (source.url ?? "#")
                    : source.type === "post"
                      ? `/post/${source.id ?? ""}`
                      : `/topic/${encodeURIComponent(source.slug ?? "")}`
                }
                target={source.type === "external" ? "_blank" : undefined}
                rel={
                  source.type === "external" ? "noopener noreferrer" : undefined
                }
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group/source"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-secondary group-hover/source:text-primary transition-colors">
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
                <span className="text-sm text-paper font-medium truncate flex-1">
                  {source.alias || source.title}
                </span>
                <svg
                  className="w-4 h-4 text-tertiary opacity-0 group-hover/source:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
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
          className={`flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${liked ? "text-like" : ""}`}
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
        </button>
        <Link
          href={`/post/${post.id}#reply`}
          aria-label={post.replyCount > 0 ? `${post.replyCount} ${t("replies")}` : t("reply")}
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
        </Link>
        <Link
          href={`/compose?quote=${post.id}`}
          aria-label={post.quoteCount > 0 ? `${post.quoteCount} ${t("quotes")}` : t("quote")}
          className="flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
          </svg>
          {post.quoteCount > 0 && (
            <span className="text-xs">{post.quoteCount}</span>
          )}
        </Link>
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
          onClick={() => setShowCollectionModal(true)}
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
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            const url = `${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`;
            navigator.clipboard?.writeText(url);
            if (navigator.share) {
              navigator.share({ url, title: post.title ?? "Post" }).catch(() => { });
            }
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
        <OverflowMenu
          postId={post.id}
          userId={post.author.handle}
          isAuthor={isAuthor}
          onCopyLink={() => {
            const url = `${window.location.origin}/post/${post.id}`;
            navigator.clipboard.writeText(url);
          }}
        />
      </div>

      <AddToCollectionModal
        postId={post.id}
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
      />
    </article>
  );
}
