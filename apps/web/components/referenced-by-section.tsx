"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { Avatar } from "./avatar";

interface ReferencedPost {
  id: string;
  title?: string;
  body: string;
  author: {
    handle: string;
    displayName: string;
    avatarKey?: string | null;
    avatarUrl?: string | null;
  };
  quoteCount: number;
  createdAt: string;
  /** When false, content is redacted; show private overlay */
  viewerCanSeeContent?: boolean;
}

export interface ReferencedBySectionProps {
  postId: string;
  quoteCount: number;
  /** When true, render without section border and heading (used inside post tabs). */
  asTabContent?: boolean;
}

function ReferencedBySectionInner({
  postId,
  quoteCount,
  asTabContent = false,
}: ReferencedBySectionProps) {
  const [referencedPosts, setReferencedPosts] = useState<ReferencedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (quoteCount > 0) {
      loadReferencedPosts(1, true);
    } else {
      setReferencedPosts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadReferencedPosts is stable, avoid re-running on its identity
  }, [postId, quoteCount]);

  const loadReferencedPosts = async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts/${postId}/referenced-by?page=${pageNum}&limit=5`,
      );
      if (res.ok) {
        const data = await res.json();
        // Handle both array (legacy) and paginated response { items: [], hasMore: boolean }
        const items = Array.isArray(data) ? data : data.items;
        const more = Array.isArray(data) ? false : data.hasMore;

        setReferencedPosts((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(more);
        setPage(pageNum);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadReferencedPosts(page + 1);
    }
  };

  const Section = asTabContent ? "div" : "section";
  const sectionClass = asTabContent
    ? "pt-1"
    : "border-t border-divider pt-8 mt-4";
  const heading = !asTabContent && (
    <h2 className="text-xl font-bold mb-6 text-paper">Referenced by</h2>
  );

  if (loading && referencedPosts.length === 0) {
    return (
      <Section className={sectionClass}>
        {heading}
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-white/5 rounded-xl"></div>
          <div className="h-24 bg-white/5 rounded-xl"></div>
        </div>
      </Section>
    );
  }

  if (quoteCount === 0 && referencedPosts.length === 0) {
    return (
      <Section className={sectionClass}>
        {heading}
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/5 rounded-xl border border-dashed border-divider text-center">
          <svg
            className="w-12 h-12 text-tertiary mb-3 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <p className="text-secondary font-medium">No posts cite this yet.</p>
        </div>
      </Section>
    );
  }

  return (
    <Section className={sectionClass}>
      {!asTabContent && (
        <div className="flex items-center justify-between gap-4 mb-6 border-b border-divider pb-2">
          <h2 className="text-xl font-bold text-paper">
            Referenced by{" "}
            <span className="text-tertiary font-normal text-lg ml-2">
              {quoteCount}
            </span>
          </h2>
          {quoteCount > 0 && (
            <Link
              href={`/post/${postId}/quotes`}
              className="text-sm font-medium text-primary hover:underline shrink-0"
            >
              View all
            </Link>
          )}
        </div>
      )}
      {referencedPosts.length > 0 ? (
        <div className="space-y-2">
          {referencedPosts.map((post) => {
            const title =
              (post.viewerCanSeeContent !== false && post.title?.trim()) ||
              "Post";
            const subtitle =
              post.viewerCanSeeContent === false
                ? "Private"
                : post.body?.trim()
                  ? `${post.body.slice(0, 80)}${post.body.length > 80 ? "…" : ""}`
                  : `@${post.author.handle}`;
            return (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all group"
              >
                <div className="shrink-0">
                  {post.viewerCanSeeContent === false ? (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-tertiary">
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
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <Avatar
                      avatarKey={post.author.avatarKey}
                      avatarUrl={post.author.avatarUrl}
                      displayName={post.author.displayName}
                      handle={post.author.handle}
                      size="sm"
                      className="!w-10 !h-10"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-paper truncate group-hover:text-primary transition-colors">
                    {title}
                  </div>
                  <div className="text-xs text-tertiary truncate mt-0.5">
                    {subtitle}
                  </div>
                </div>
                <svg
                  className="w-5 h-5 shrink-0 text-tertiary group-hover:text-primary transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            );
          })}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full py-3 mt-4 text-sm font-medium text-tertiary hover:text-paper bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
            >
              {loading ? "Loading..." : "Load more cites"}
            </button>
          )}
        </div>
      ) : (
        <p className="text-secondary text-sm">
          {quoteCount > 0
            ? `${quoteCount} posts reference this post`
            : "Not referenced yet."}
        </p>
      )}
    </Section>
  );
}

export const ReferencedBySection = memo(ReferencedBySectionInner);
