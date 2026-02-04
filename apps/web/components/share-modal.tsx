"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "./avatar";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  authorIsProtected?: boolean;
}

interface ThreadItem {
  id: string;
  otherUser: {
    id: string;
    handle: string;
    displayName: string;
    avatarKey?: string;
    avatarUrl?: string;
  };
  lastMessage?: { body: string; createdAt: string } | null;
  unreadCount: number;
}

export function ShareModal({
  isOpen,
  onClose,
  url,
  title,
  authorIsProtected,
}: ShareModalProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const { success: toastSuccess } = useToast();

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => setLoading(true));
      fetch("/api/messages/threads")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setThreads(Array.isArray(data) ? data.slice(0, 8) : []);
        })
        .catch(() => setThreads([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSendToThread = (threadId: string) => {
    router.push(
      `/inbox?thread=${threadId}&initialMessage=${encodeURIComponent(url)}`,
    );
    onClose();
  };

  const handleNewMessage = () => {
    router.push(`/inbox?initialMessage=${encodeURIComponent(url)}`);
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toastSuccess("Link copied to clipboard");
    } catch {
      // fallback
    }
    onClose();
  };

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "Share",
          url: url,
        });
      } catch {
        // ignore
      }
    }
    onClose();
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#1e1f21] rounded-2xl border border-white/10 shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />

        <h2 className="text-xl font-bold text-paper text-center mb-6">Share</h2>

        {/* Send as DM Section */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-3">
            Send as DM
          </p>

          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {loading ? (
              <p className="text-secondary text-sm">Loading...</p>
            ) : (
              <>
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => handleSendToThread(thread.id)}
                    className="flex flex-col items-center gap-2 min-w-[64px] group"
                  >
                    <Avatar
                      avatarKey={thread.otherUser.avatarKey}
                      avatarUrl={thread.otherUser.avatarUrl}
                      displayName={thread.otherUser.displayName}
                      handle={thread.otherUser.handle}
                      size="md"
                      className="group-hover:ring-2 ring-primary transition-all"
                    />
                    <span className="text-xs text-paper truncate w-full text-center">
                      {thread.otherUser.displayName.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>

          <button
            onClick={handleNewMessage}
            className="w-full flex items-center gap-3 py-3 border-b border-white/10 hover:bg-white/5 transition-colors rounded-lg px-2"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="text-paper font-medium">New message</span>
          </button>
        </div>

        {/* Other Ways Section */}
        {!authorIsProtected && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
              Other ways
            </p>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 py-3 hover:bg-white/5 transition-colors rounded-lg px-2"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-paper">
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-paper font-medium">Copy Link</span>
            </button>

            {typeof navigator !== "undefined" &&
              "share" in navigator &&
              typeof navigator.share === "function" && (
                <button
                  onClick={handleSystemShare}
                  className="w-full flex items-center gap-3 py-3 hover:bg-white/5 transition-colors rounded-lg px-2"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-paper">
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </div>
                  <span className="text-paper font-medium">Share via...</span>
                </button>
              )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl border border-white/10 text-paper font-semibold hover:bg-white/5 transition-colors"
        >
          {tCommon("cancel")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
