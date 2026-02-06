"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  EmptyState,
  emptyStateCenterClassName,
} from "@/components/ui/empty-state";

interface BlockedUser {
  id: string;
  handle: string;
  displayName: string;
}

export default function BlockedPage() {
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBlocked();
  }, []);

  const loadBlocked = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/safety/blocked");
      if (res.ok) {
        const data = await res.json();
        setBlocked(data.map((b: { blocked: BlockedUser }) => b.blocked));
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error("Failed to load blocked users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      const res = await fetch(`/api/safety/block/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadBlocked();
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error("Failed to unblock", error);
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
          <h1 className="text-xl font-bold text-paper">Blocked Accounts</h1>
        </div>
      </header>

      <div className="px-6 py-6 flex-1 flex flex-col min-h-[200px]">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-secondary text-sm">Loading...</p>
          </div>
        ) : blocked.length === 0 ? (
          <div className={emptyStateCenterClassName}>
            <EmptyState
              icon="block"
              headline="No blocked accounts"
              subtext="You haven't blocked anyone yet."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {blocked.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {user.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-paper">
                      {user.displayName}
                    </div>
                    <div className="text-sm text-tertiary">@{user.handle}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(user.id)}
                  className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
