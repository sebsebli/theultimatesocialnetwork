"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  EmptyState,
  emptyStateCenterClassName,
} from "@/components/ui/empty-state";
import { PostItem } from "@/components/post-item";

interface Keep {
  id: string;
  createdAt: string;
  post: {
    id: string;
    title?: string;
    body: string;
    author: {
      handle: string;
      displayName: string;
    };
  };
}

export default function KeepsPage() {
  const [keeps, setKeeps] = useState<Keep[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unsorted" | "in-collections">(
    "all",
  );

  const loadKeeps = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filter === "in-collections") params.append("inCollection", "true");
      if (filter === "unsorted") params.append("inCollection", "false");

      const res = await fetch(`/api/keeps?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setKeeps(Array.isArray(data) ? data : (data?.items ?? []));
      } else {
        setLoadError(true);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error("Failed to load keeps", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    loadKeeps();
  }, [loadKeeps]);

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      {/* Header — match mobile: back + title */}
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/home" className="text-secondary hover:text-paper">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-paper">Keeps Library</h1>
          <div className="w-6" />
        </div>
      </header>

      {/* Search and Filters */}
      <div className="px-6 py-4 space-y-4 border-b border-divider">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keeps..."
          className="w-full px-4 py-2 border-b border-divider text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === "all"
                ? "bg-primary text-white"
                : "bg-white/5 text-secondary hover:bg-white/10"
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unsorted")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === "unsorted"
                ? "bg-primary text-white"
                : "bg-white/5 text-secondary hover:bg-white/10"
              }`}
          >
            Unsorted
          </button>
          <button
            onClick={() => setFilter("in-collections")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === "in-collections"
                ? "bg-primary text-white"
                : "bg-white/5 text-secondary hover:bg-white/10"
              }`}
          >
            In Collections
          </button>
        </div>
      </div>

      {/* Keeps List */}
      <div className="px-6 py-6 flex-1 flex flex-col min-h-[200px]">
        {loading && !loadError ? (
          <div className="text-center py-12">
            <p className="text-secondary text-sm">Loading...</p>
          </div>
        ) : loadError ? (
          <div className={emptyStateCenterClassName}>
            <p className="text-secondary text-sm mb-4">
              Failed to load keeps. Please try again.
            </p>
            <button
              type="button"
              onClick={() => loadKeeps()}
              className="text-primary hover:underline font-medium"
            >
              Retry
            </button>
          </div>
        ) : keeps.length === 0 ? (
          <div className={emptyStateCenterClassName}>
            <EmptyState
              icon="bookmark"
              headline="No keeps yet"
              subtext="Keep interesting posts to build your personal library."
            >
              <div className="mt-6">
                <button
                  onClick={() => (window.location.href = "/explore")}
                  className="text-primary hover:underline"
                >
                  Explore posts
                </button>
              </div>
            </EmptyState>
          </div>
        ) : (
          <div className="space-y-0 border-t border-divider">
            {keeps.map((keep) => (
              <div key={keep.id} className="border-b border-divider">
                <PostItem
                  post={{
                    ...keep.post,
                    replyCount: 0,
                    quoteCount: 0,
                    createdAt: keep.createdAt,
                    isKept: true,
                  }}
                  onKeep={() => {
                    setKeeps((prev) =>
                      prev.filter((k) => k.post.id !== keep.post.id),
                    );
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
