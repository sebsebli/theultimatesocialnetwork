"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";

interface ContinueExploringProps {
  currentTopicSlug?: string;
  currentTopicTitle?: string;
  postsRead?: number;
}

function ContinueExploringInner({
  currentTopicSlug,
  currentTopicTitle,
  postsRead,
}: ContinueExploringProps) {
  const [suggestions, setSuggestions] = useState<
    Array<{ slug: string; title: string; sharedPosts: number }>
  >([]);

  useEffect(() => {
    if (!currentTopicSlug) return;
    let cancelled = false;
    fetch(`/api/topics/${encodeURIComponent(currentTopicSlug)}/map`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.connectedTopics) {
          setSuggestions(data.connectedTopics.slice(0, 5));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentTopicSlug]);

  if (suggestions.length === 0 || !currentTopicSlug) return null;

  return (
    <div className="mx-auto max-w-[680px] px-6 py-10">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0020 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <div>
            <h3 className="text-sm font-bold text-paper">Continue exploring</h3>
            {postsRead && postsRead > 0 && (
              <p className="text-xs text-tertiary">
                You&apos;ve read {postsRead} posts in{" "}
                {currentTopicTitle || currentTopicSlug}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {suggestions.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topic/${encodeURIComponent(topic.slug)}`}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-primary font-mono text-xs">#</span>
                <div>
                  <span className="text-sm font-semibold text-paper group-hover:text-primary transition-colors">
                    {topic.title}
                  </span>
                  {topic.sharedPosts > 0 && (
                    <span className="text-xs text-tertiary ml-2">
                      {topic.sharedPosts} shared posts
                    </span>
                  )}
                </div>
              </div>
              <svg
                className="w-4 h-4 text-tertiary group-hover:text-primary transition-colors"
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
    </div>
  );
}

export const ContinueExploring = memo(ContinueExploringInner);
