"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/avatar";
import { useToast } from "@/components/ui/toast";

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
  viewerCanSeeContent?: boolean;
}

export default function PostQuotesPage() {
  const params = useParams();
  const t = useTranslations("post");
  const { error: toastError } = useToast();
  const postId = params.id as string;
  const [postTitle, setPostTitle] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<ReferencedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [postNotFound, setPostNotFound] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const loadQuotes = useCallback(
    async (pageNum: number, reset = false) => {
      if (reset) {
        setLoading(true);
        setPostNotFound(false);
        setFetchError(false);
      } else setLoadingMore(true);
      try {
        const [postRes, refRes] = await Promise.all([
          fetch(`/api/posts/${postId}`),
          fetch(`/api/posts/${postId}/referenced-by?page=${pageNum}&limit=20`),
        ]);
        if (reset && !postRes.ok) {
          if (postRes.status === 404 || postRes.status === 403) {
            setPostNotFound(true);
          } else {
            setFetchError(true);
          }
        }
        if (postRes.ok && reset) {
          const postData = await postRes.json();
          setPostTitle(postData.title ?? null);
        }
        if (refRes.ok) {
          const data = await refRes.json();
          const items = Array.isArray(data) ? data : (data.items ?? []);
          const more = Array.isArray(data) ? false : (data.hasMore ?? false);
          setQuotes((prev) => (reset ? items : [...prev, ...items]));
          setHasMore(more);
          setPage(pageNum);
        } else if (reset) {
          setFetchError(true);
        }
      } catch {
        if (reset) {
          setQuotes([]);
          setFetchError(true);
          toastError("Failed to load. Try again.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [postId, toastError],
  );

  useEffect(() => {
    if (postId) loadQuotes(1, true);
  }, [postId, loadQuotes]);

  if (!postId) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6">
        <p className="text-secondary mb-4">Invalid post.</p>
        <Link href="/home" className="text-primary hover:underline font-medium">
          Back to home
        </Link>
      </div>
    );
  }

  if (postNotFound) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6">
        <h1 className="text-xl font-bold text-paper mb-2">Post not found</h1>
        <p className="text-secondary mb-4">
          This post is private or does not exist.
        </p>
        <Link href="/home" className="text-primary hover:underline font-medium">
          Back to home
        </Link>
      </div>
    );
  }

  if (fetchError && !loading && quotes.length === 0) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6">
        <p className="text-secondary mb-4">Failed to load. Please try again.</p>
        <button
          type="button"
          onClick={() => loadQuotes(1, true)}
          className="text-primary hover:underline font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <header className="sticky top-0 z-10 bg-ink/90 backdrop-blur-md border-b border-divider flex items-center justify-between px-4 py-3">
        <Link
          href={`/post/${postId}`}
          className="text-secondary hover:text-paper flex items-center gap-2"
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
          Back to post
        </Link>
        <h1 className="text-lg font-semibold text-paper truncate max-w-[200px]">
          {t("quotedBy")}
        </h1>
        <div className="w-20" />
      </header>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {loading && quotes.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-white/5 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white/5 rounded-xl border border-dashed border-divider text-center">
            <svg
              className="w-12 h-12 text-tertiary mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            <p className="text-secondary font-medium">
              No posts cite this yet.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {quotes.map((post) => {
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
            </div>
            {hasMore && (
              <button
                onClick={() => loadQuotes(page + 1)}
                disabled={loadingMore}
                className="w-full py-3 mt-4 text-sm font-medium text-tertiary hover:text-paper bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
