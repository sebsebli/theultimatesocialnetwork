"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  getAllOfflinePosts,
  removeOfflinePost,
  clearAllOfflinePosts,
  OfflinePost,
} from "@/lib/offline-storage";
import {
  EmptyState,
  emptyStateCenterClassName,
} from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitialOfflineState(): {
  posts: OfflinePost[];
  storageSize: number;
} {
  if (typeof window === "undefined") return { posts: [], storageSize: 0 };
  const list = getAllOfflinePosts();
  let size = 0;
  for (const key in localStorage) {
    if (key.startsWith("citewalk_offline_")) {
      size += (localStorage.getItem(key) || "").length;
    }
  }
  return { posts: list, storageSize: size };
}

export default function OfflineSettingsPage() {
  const [state, setState] = useState(getInitialOfflineState);
  const { success } = useToast();

  const load = useCallback(() => {
    const { posts: list, storageSize: size } = getInitialOfflineState();
    setState({ posts: list, storageSize: size });
  }, []);

  const handleRemove = (id: string) => {
    if (confirm("Remove this article from offline storage?")) {
      removeOfflinePost(id);
      load();
      success("Article removed");
    }
  };

  const handleClearAll = () => {
    if (confirm("Remove all offline articles?")) {
      clearAllOfflinePosts();
      load();
      success("All offline articles removed");
    }
  };

  return (
    <div className="max-w-[680px] mx-auto min-h-screen border-x border-divider bg-ink flex flex-col">
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-secondary hover:text-paper">
            <svg
              className="w-6 h-6"
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
          <h1 className="text-xl font-bold text-paper">Offline Storage</h1>
        </div>
      </header>

      <div className="px-6 py-4 bg-white/5 flex items-center justify-between">
        <p className="text-secondary text-sm font-medium">
          {state.posts.length} articles · {formatSize(state.storageSize)}
        </p>
        {state.posts.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-error hover:text-red-400 text-sm font-semibold transition-colors"
          >
            Remove all
          </button>
        )}
      </div>

      <div className="px-6 py-6 flex-1 flex flex-col min-h-[200px]">
        {state.posts.length === 0 ? (
          <div className={emptyStateCenterClassName}>
            <EmptyState
              icon="offline_pin"
              headline="No offline articles"
              subtext="Download articles from the reading screen to read offline."
            />
          </div>
        ) : (
          <div className="space-y-0">
            {state.posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between py-4 border-b border-divider group"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <Link href={`/post/${post.id}/reading`} className="block">
                    <h3 className="text-paper font-medium truncate mb-1 group-hover:text-primary transition-colors">
                      {post.title || "Untitled Post"}
                    </h3>
                    <p className="text-tertiary text-sm truncate">
                      {post.author.displayName}
                    </p>
                  </Link>
                </div>
                <button
                  onClick={() => handleRemove(post.id)}
                  className="p-2 text-tertiary hover:text-error hover:bg-white/5 rounded-full transition-colors"
                  title="Remove"
                  aria-label="Remove article from offline storage"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
