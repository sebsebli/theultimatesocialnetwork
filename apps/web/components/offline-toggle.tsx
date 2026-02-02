"use client";

import { useState } from "react";
import {
  savePostForOffline,
  removeOfflinePost,
  getOfflinePost,
  OfflinePost,
} from "@/lib/offline-storage";
import { useToast } from "@/components/ui/toast";

interface OfflineToggleProps {
  post: {
    id: string;
    title?: string;
    body: string;
    author: {
      displayName: string;
      handle: string;
    };
  };
}

export function OfflineToggle({ post }: OfflineToggleProps) {
  const [isOffline, setIsOffline] = useState(() =>
    typeof window !== "undefined" ? !!getOfflinePost(post.id) : false,
  );
  const { success } = useToast();

  const toggle = () => {
    if (isOffline) {
      removeOfflinePost(post.id);
      setIsOffline(false);
    } else {
      const payload: OfflinePost = {
        id: post.id,
        title: post.title,
        body: post.body,
        author: {
          displayName: post.author.displayName,
          handle: post.author.handle,
        },
        savedAt: Date.now(),
      };
      savePostForOffline(payload);
      setIsOffline(true);
      success("Saved for offline reading");
    }
  };

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-full transition-colors ${
        isOffline
          ? "text-primary bg-primary/10"
          : "text-tertiary hover:text-paper hover:bg-white/5"
      }`}
      title={isOffline ? "Remove from offline" : "Save for offline"}
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
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    </button>
  );
}
