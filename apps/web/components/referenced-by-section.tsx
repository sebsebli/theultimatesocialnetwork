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
}

export interface ReferencedBySectionProps {
  postId: string;
  quoteCount: number;
}

function ReferencedBySectionInner({
  postId,
  quoteCount,
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

  if (loading && referencedPosts.length === 0) {
    return (
      <section className="border-t border-divider pt-8 mt-4">
        <h2 className="text-xl font-bold mb-6 text-paper">Referenced by</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-white/5 rounded-xl"></div>
          <div className="h-24 bg-white/5 rounded-xl"></div>
        </div>
      </section>
    );
  }

  if (quoteCount === 0 && referencedPosts.length === 0) {
    return (
      <section className="border-t border-divider pt-8 mt-4">
        <h2 className="text-xl font-bold mb-6 text-paper">Referenced by</h2>
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
          <p className="text-secondary font-medium">No posts quote this yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-divider pt-8 mt-4">
      <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2">
        Referenced by{" "}
        <span className="text-tertiary font-normal text-lg ml-2">
          {quoteCount}
        </span>
      </h2>
      {referencedPosts.length > 0 ? (
        <div className="space-y-4">
          {referencedPosts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block p-5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  avatarKey={post.author.avatarKey}
                  avatarUrl={post.author.avatarUrl}
                  displayName={post.author.displayName}
                  handle={post.author.handle}
                  size="sm"
                />
                <div>
                  <div className="text-sm font-semibold text-paper group-hover:text-primary transition-colors">
                    {post.author.displayName}
                  </div>
                  <div className="text-xs text-tertiary">
                    @{post.author.handle}
                  </div>
                </div>
              </div>
              {post.title && (
                <h3 className="text-lg font-bold text-paper mb-2 leading-tight">
                  {post.title}
                </h3>
              )}
              <p className="text-[15px] leading-relaxed text-secondary line-clamp-3">
                {post.body}
              </p>
            </Link>
          ))}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full py-3 mt-4 text-sm font-medium text-tertiary hover:text-paper bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
            >
              {loading ? "Loading..." : "Load more quotes"}
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
    </section>
  );
}

export const ReferencedBySection = memo(ReferencedBySectionInner);
