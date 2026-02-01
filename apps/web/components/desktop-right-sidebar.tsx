"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "./avatar";

interface Topic {
  id: string;
  slug: string;
  title: string;
  postCount?: number;
}

interface User {
  id: string;
  handle: string;
  displayName: string;
  avatarKey?: string | null;
  avatarUrl?: string | null;
}

export function DesktopRightSidebar() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, usersRes] = await Promise.all([
          fetch("/api/explore/topics"),
          fetch("/api/users/suggested"),
        ]);

        if (topicsRes.ok) {
          const data = await topicsRes.json();
          setTopics(Array.isArray(data) ? data.slice(0, 5) : []);
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data.slice(0, 3) : []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <aside className="hidden lg:block lg:w-72 xl:w-80 lg:sticky lg:top-6 lg:h-[calc(100vh-24px)] lg:overflow-y-auto lg:px-4 shrink-0">
      <div className="flex flex-col gap-6 pt-6">
        {/* Trending Topics */}
        {loading ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 h-48 animate-pulse" />
        ) : (
          topics.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-bold text-paper mb-3 uppercase tracking-wider">
                Trending Topics
              </h3>
              <div className="flex flex-col gap-3">
                {topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topic/${encodeURIComponent(topic.slug)}`}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-paper group-hover:text-primary transition-colors">
                        {topic.title}
                      </p>
                      {topic.postCount !== undefined && (
                        <p className="text-xs text-tertiary mt-1">
                          {topic.postCount} posts
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        )}

        {/* Recommended People */}
        {loading ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 h-40 animate-pulse" />
        ) : (
          users.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-bold text-paper mb-3 uppercase tracking-wider">
                Who to Follow
              </h3>
              <div className="flex flex-col gap-3">
                {users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/user/${user.handle}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <Avatar
                      avatarKey={user.avatarKey}
                      avatarUrl={user.avatarUrl}
                      displayName={user.displayName}
                      handle={user.handle}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-paper group-hover:text-primary transition-colors">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-tertiary">@{user.handle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        )}

        {/* Quick Links */}
        <div className="flex flex-col gap-2 text-xs text-tertiary">
          <Link
            href="/privacy"
            className="hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/ai-transparency"
            className="hover:text-primary transition-colors"
          >
            AI Transparency
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
          <Link
            href="/imprint"
            className="hover:text-primary transition-colors"
          >
            Imprint
          </Link>
        </div>
      </div>
    </aside>
  );
}
