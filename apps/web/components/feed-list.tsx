"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PostItem, type Post } from "./post-item";
import { SavedByItem } from "./saved-by-item";
import { InviteNudge } from "./invite-nudge";
import { FeedCrossroads } from "./feed-crossroads";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  EmptyState,
  emptyStateCenterClassName,
} from "@/components/ui/empty-state";

// Bypass ESM static analysis for these legacy packages
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { VariableSizeList: List } = require("react-window");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AutoSizer = require("react-virtualized-auto-sizer").default;

interface FeedReason {
  type: "followed_author" | "followed_topic" | "own_post";
  authorHandle?: string;
  authorDisplayName?: string;
  topicTitle?: string;
  topicSlug?: string;
}

interface FeedItemShape {
  type: string;
  reason?: FeedReason;
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

export interface FeedListProps {
  initialPosts: (Post | FeedItemShape)[];
}

export function FeedList({ initialPosts }: FeedListProps) {
  const { error: showError } = useToast();
  const [posts, setPosts] = useState<(Post | FeedItemShape)[]>(initialPosts);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<{ resetAfterIndex: (index: number) => void } | null>(
    null,
  );
  const rowHeights = useRef<Record<number, number>>({});

  // Measurement callback for dynamic heights
  const setRowHeight = useCallback((index: number, size: number) => {
    if (rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      listRef.current?.resetAfterIndex(index);
    }
  }, []);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const limit = 20;
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/feed?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newItems = Array.isArray(data) ? data : data.items || [];

        if (data.nextCursor) {
          setCursor(data.nextCursor);
          setHasMore(true);
        } else if (newItems.length < limit) {
          setHasMore(false);
        }

        setPosts((prev) => [...prev, ...newItems]);
      } else {
        const body = await res.json().catch(() => null);
        showError(
          getApiErrorMessage(res.status, body) || "Couldn’t load more.",
        );
        setHasMore(false);
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error(e);
      showError("Couldn’t load more.");
    } finally {
      setLoading(false);
    }
  };

  // Row Renderer
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.getBoundingClientRect().height);
      }
    }, [index]);

    // Load More trigger at the end
    if (index === posts.length) {
      return (
        <div style={style} ref={rowRef} className="py-6 flex justify-center">
          {hasMore ? (
            <button
              onClick={loadMore}
              disabled={loading}
              className="text-sm text-secondary hover:text-primary"
            >
              {loading ? "Loading..." : "Load more posts"}
            </button>
          ) : (
            <div className="text-tertiary text-sm">
              You&apos;re all caught up.
            </div>
          )}
        </div>
      );
    }

    const item = posts[index];
    const withType = item as FeedItemShape;
    let content;

    if (
      withType.type === "saved_by" &&
      withType.data &&
      "post" in withType.data
    ) {
      const d = withType.data as {
        userId: string;
        userName: string;
        collectionId: string;
        collectionName: string;
        post: Post;
      };
      content = (
        <SavedByItem
          userId={d.userId}
          userName={d.userName}
          collectionId={d.collectionId}
          collectionName={d.collectionName}
          post={{ ...d.post, isKept: true }}
        />
      );
    } else {
      const postItem = withType.type === "post" ? withType.data : item;
      const post = postItem as Post;
      const reason = withType.reason;
      const showReason = reason && reason.type !== "own_post";
      content = (
        <>
          {showReason && (
            <a
              href={
                reason.type === "followed_topic" && reason.topicSlug
                  ? `/topic/${encodeURIComponent(reason.topicSlug)}`
                  : reason.type === "followed_author" && reason.authorHandle
                    ? `/user/${reason.authorHandle}`
                    : undefined
              }
              className="flex items-center gap-1.5 px-5 md:px-6 pt-4 pb-0 text-tertiary text-xs hover:text-secondary transition-colors"
            >
              {reason.type === "followed_topic" ? (
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center font-mono font-bold text-[9px] leading-none">[[]]</span>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              <span>
                {reason.type === "followed_topic"
                  ? reason.topicTitle
                    ? `From a topic you follow: ${reason.topicTitle}`
                    : "From a topic you follow"
                  : reason.authorDisplayName
                    ? `Because you follow ${reason.authorDisplayName}`
                    : "From someone you follow"}
              </span>
            </a>
          )}
          <PostItem
            post={{
              ...post,
              isLiked: post.isLiked,
              isKept: post.isKept,
            }}
          />
        </>
      );
    }

    return (
      <div style={style}>
        <div ref={rowRef} className="border-b border-divider">
          {content}
        </div>
      </div>
    );
  };

  if (posts.length === 0) {
    return (
      <div className={emptyStateCenterClassName}>
        <EmptyState
          icon="home"
          headline="Your timeline is quiet"
          subtext="Follow people."
          compact
        >
          <InviteNudge />
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-[calc(100vh-60px)] w-full">
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              ref={listRef}
              height={height}
              width={width}
              itemCount={posts.length + 1} // +1 for loader
              itemSize={(index: number) => rowHeights.current[index] || 150} // Estimate
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
      {!hasMore && posts.length > 0 && <FeedCrossroads />}
    </div>
  );
}
