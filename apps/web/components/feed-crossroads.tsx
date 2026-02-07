"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";

interface TrendingTopic {
  id: string;
  slug: string;
  title: string;
  postCount?: number;
}

function FeedCrossroadsInner() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/explore/topics?sort=popular&limit=6")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          const items = Array.isArray(data) ? data : data.items || [];
          setTopics(items.slice(0, 6));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (topics.length === 0) return null;

  return (
    <div className="py-8 px-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 max-w-[680px] mx-auto">
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
            <h3 className="text-sm font-bold text-paper">
              Explore more topics
            </h3>
            <p className="text-xs text-tertiary">
              Deep dive into ideas that interest you
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topic/${encodeURIComponent(topic.slug)}`}
              className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-all group"
            >
              <span className="text-primary font-mono text-[10px]">[[]]</span>
              <div className="min-w-0">
                <span className="text-sm font-medium text-paper group-hover:text-primary transition-colors truncate block">
                  {topic.title}
                </span>
                {topic.postCount != null && topic.postCount > 0 && (
                  <span className="text-[10px] text-tertiary">
                    {topic.postCount} posts
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/explore"
          className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-paper transition-colors py-2"
        >
          Explore all topics
          <svg
            className="w-4 h-4"
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
      </div>
    </div>
  );
}

export const FeedCrossroads = memo(FeedCrossroadsInner);
