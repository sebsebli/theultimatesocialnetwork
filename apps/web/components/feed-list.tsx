"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PostItem, type Post } from "./post-item";
import { SavedByItem } from "./saved-by-item";
import { InviteNudge } from "./invite-nudge";
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
      console.error(e);
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
      content = (
        <PostItem
          post={{
            ...post,
            isLiked: post.isLiked,
            isKept: post.isKept,
          }}
        />
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
  );
}
