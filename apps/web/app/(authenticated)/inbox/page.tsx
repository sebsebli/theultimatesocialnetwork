"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MessagesTab } from "@/components/messages-tab";

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
  const [activeTab, setActiveTab] = useState<"notifications" | "messages">(
    threadIdFromUrl ? "messages" : "notifications",
  );
  const [tabData, setTabData] = useState<{
    notifications: Notification[];
  }>({
    notifications: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "notifications" && tabData.notifications.length === 0) {
      loadNotifications();
    }
  }, [activeTab, tabData.notifications.length]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setTabData((prev) => ({ ...prev, notifications: data }));
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      // Update local state optimistically
      setTabData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({
          ...n,
          readAt: new Date().toISOString(),
        })),
      }));
    } catch (e) {
      console.error(e);
      loadNotifications(); // Reload on failure
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
      // For replies/mentions, ideally link to anchor if replyId exists
      // but standard post link is a safe fallback matching mobile logic parity
      return `/post/${notif.post.id}`;
    }
    return "#";
  };

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-divider px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-paper">Inbox</h1>
        {activeTab === "notifications" && tabData.notifications.length > 0 && (
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

      <div className="px-4 py-4 pb-20 md:pb-0">
        {activeTab === "notifications" && (
          <div className="space-y-4">
            {loading && tabData.notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary text-sm">
                  Loading notifications...
                </p>
              </div>
            ) : tabData.notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary text-sm">No notifications yet.</p>
              </div>
            ) : (
              tabData.notifications.map((notif) => (
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
              ))
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <MessagesTab initialThreadId={threadIdFromUrl || undefined} />
        )}
      </div>
    </>
  );
}
