"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PostItem, type Post } from "./post-item";
import { SavedByItem } from "./saved-by-item";
import { InviteNudge } from "./invite-nudge";
import { UserCard } from "./user-card";

interface FeedItemShape {
  type: string;
  data?:
    | Post
    | {
        post: Post;
        userId: string;
        userName: string;
        collectionId: string;
        collectionName: string;
      };
}

interface FeedListProps {
  initialPosts: (Post | FeedItemShape)[];
}

export function FeedList({ initialPosts }: FeedListProps) {
  const [posts, setPosts] = useState<(Post | FeedItemShape)[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [suggestions, setSuggestions] = useState<
    { id: string; isFollowing?: boolean; [key: string]: unknown }[]
  >([]);

  // If initial load is empty, fetch suggestions
  useEffect(() => {
    if (posts.length === 0) {
      fetchSuggestions();
    }
  }, [posts.length]);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/api/users/suggested?limit=5");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    }
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const limit = 20;
      const offset = (nextPage - 1) * limit;

      const res = await fetch(`/api/feed?limit=${limit}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        const newItems = Array.isArray(data) ? data : data.items || [];

        if (newItems.length < limit) {
          setHasMore(false);
        }

        setPosts((prev) => [...prev, ...newItems]);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Failed to load more posts", e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowSuggestion = async (userId: string) => {
    setSuggestions((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u,
      ),
    );

    try {
      const isFollowing = suggestions.find((u) => u.id === userId)?.isFollowing;
      const method = isFollowing ? "DELETE" : "POST";
      await fetch(`/api/users/${userId}/follow`, { method });
    } catch {
      // Revert on error
      setSuggestions((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u,
        ),
      );
    }
  };

  if (posts.length === 0) {
    return (
      <div className="py-12 px-6 flex flex-col items-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-paper mb-2 text-center">
          Your timeline is quiet
        </h3>
        <p className="text-secondary text-base mb-8 text-center leading-relaxed">
          Follow people and topics to see posts here.
        </p>

        <div className="w-full space-y-4 mb-8">
          <InviteNudge />
          <Link
            href="/explore"
            className="flex items-center justify-center w-full px-6 py-3 bg-white/5 text-paper border border-white/10 rounded-xl hover:bg-white/10 transition-all font-semibold"
          >
            Explore Topics
          </Link>
        </div>

        {suggestions.length > 0 && (
          <div className="w-full">
            <h4 className="text-sm font-bold text-tertiary uppercase tracking-wider mb-3">
              People to follow
            </h4>
            <div className="flex flex-col gap-3">
              {suggestions.map((user) => (
                <UserCard
                  key={user.id}
                  person={user}
                  onFollow={() => handleFollowSuggestion(user.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="divide-y divide-divider">
        {posts.map((item: Post | FeedItemShape, index: number) => {
          // Handle FeedItem format: { type: 'post' | 'saved_by', data: ... }
          const withType = item as FeedItemShape;
          if (
            withType.type === "saved_by" &&
            withType.data &&
            "post" in withType.data
          ) {
            const d = withType.data;
            return (
              <SavedByItem
                key={`saved-${d.post?.id ?? (d as { postId?: string }).postId}-${d.userId}-${index}`}
                userId={d.userId}
                userName={d.userName}
                collectionId={d.collectionId}
                collectionName={d.collectionName}
                post={d.post}
              />
            );
          }
          if (withType.type === "post" && withType.data) {
            return (
              <PostItem
                key={(withType.data as Post).id}
                post={withType.data as Post}
              />
            );
          }
          // Fallback for direct post objects
          return <PostItem key={(item as Post).id} post={item as Post} />;
        })}
      </div>

      {hasMore && (
        <div className="p-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-secondary hover:text-primary hover:border-primary/30 transition-all font-medium text-sm disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="p-8 text-center text-tertiary text-sm">
          You&apos;re all caught up.
        </div>
      )}
    </div>
  );
}
