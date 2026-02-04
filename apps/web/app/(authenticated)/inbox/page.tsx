"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MessagesTab } from "@/components/messages-tab";
import { useRealtime } from "@/context/realtime-provider";
import {
  EmptyState,
  emptyStateCenterClassName,
} from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  createdAt: string;
  actor?: {
    handle: string;
    displayName: string;
  };
  post?: {
    id: string;
    title?: string;
  };
  replyId?: string;
  readAt?: string;
}

export default function InboxPage() {
  const searchParams = useSearchParams();
  const threadIdFromUrl = searchParams.get("thread");
  const initialMessageFromUrl = searchParams.get("initialMessage");
  const [activeTab, setActiveTab] = useState<"notifications" | "messages">(
    threadIdFromUrl || initialMessageFromUrl ? "messages" : "notifications",
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { on, off } = useRealtime();

  // Load initial notifications
  useEffect(() => {
    if (activeTab === "notifications" && notifications.length === 0) {
      loadNotifications(1, true);
    }
  }, [activeTab, notifications.length]);

  // Real-time listener
  useEffect(() => {
    const handleNotification = () => loadNotifications(1, true);
    on("notification", handleNotification);
    return () => {
      off("notification", handleNotification);
    };
  }, [on, off]);

  const loadNotifications = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setLoadError(false);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await fetch(`/api/notifications?page=${pageNum}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.items || data)
          ? data.items || data
          : [];
        if (reset) {
          setNotifications(items);
        } else {
          setNotifications((prev) => [...prev, ...items]);
        }
        setHasMore(items.length === 20 && data.hasMore !== false);
      } else if (reset) {
        setLoadError(true);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
      if (reset) setLoadError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadNotifications(nextPage, false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      // Update local state optimistically
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          readAt: new Date().toISOString(),
        })),
      );
    } catch (e) {
      console.error(e);
      loadNotifications(1, true); // Reload on failure
    }
  };

  const formatNotificationText = (notif: Notification) => {
    const actorName = notif.actor?.displayName || "Someone";
    switch (notif.type) {
      case "FOLLOW":
        return `${actorName} followed you`;
      case "REPLY":
        return `${actorName} replied to your post`;
      case "QUOTE":
        return `${actorName} quoted your post`;
      case "LIKE":
        return `${actorName} liked your post`;
      case "MENTION":
        return `${actorName} mentioned you`;
      default:
        return "New notification";
    }
  };

  const getNotificationLink = (notif: Notification) => {
    if (notif.type === "FOLLOW" && notif.actor?.handle) {
      return `/user/${notif.actor.handle}`;
    }
    if (notif.post?.id) {
      return `/post/${notif.post.id}`;
    }
    return "#";
  };

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-divider px-4 md:px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-paper">Inbox</h1>
        {activeTab === "notifications" && notifications.length > 0 && (
          <button
            onClick={markAllRead}
            className="text-primary text-sm font-medium hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="sticky top-[53px] z-40 bg-ink border-b border-divider flex">
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "notifications"
              ? "border-primary text-paper"
              : "border-transparent text-tertiary hover:text-paper"
          }`}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "messages"
              ? "border-primary text-paper"
              : "border-transparent text-tertiary hover:text-paper"
          }`}
        >
          Messages
        </button>
      </div>

      <div className="px-4 py-4 pb-20 md:pb-0 flex flex-1 flex-col min-h-0">
        {activeTab === "notifications" && (
          <div
            className={`space-y-4 ${notifications.length === 0 ? "flex flex-1 flex-col min-h-[200px]" : ""}`}
          >
            {loading && notifications.length === 0 && !loadError ? (
              <div className="text-center py-12">
                <p className="text-secondary text-sm">
                  Loading notifications...
                </p>
              </div>
            ) : loadError && notifications.length === 0 ? (
              <div className={emptyStateCenterClassName}>
                <p className="text-secondary text-sm mb-4">
                  Failed to load notifications. Please try again.
                </p>
                <button
                  type="button"
                  onClick={() => loadNotifications(1, true)}
                  className="text-primary hover:underline font-medium"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className={emptyStateCenterClassName}>
                <EmptyState
                  icon="notifications_none"
                  headline="No notifications yet"
                  subtext="When someone follows you, replies, or mentions you, it will show up here."
                />
              </div>
            ) : (
              <>
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={getNotificationLink(notif)}
                    className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                        {notif.actor?.displayName?.charAt(0) || "N"}
                      </div>
                      <div className="flex-1">
                        <p className="text-paper text-sm">
                          {formatNotificationText(notif)}
                        </p>
                        <p className="text-tertiary text-xs mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notif.readAt && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1"></div>
                      )}
                    </div>
                  </Link>
                ))}

                {hasMore && (
                  <div className="text-center pt-4 pb-8">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? "Loading..." : "Load more"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <MessagesTab
            initialThreadId={threadIdFromUrl || undefined}
            initialMessage={initialMessageFromUrl || undefined}
          />
        )}
      </div>
    </>
  );
}
