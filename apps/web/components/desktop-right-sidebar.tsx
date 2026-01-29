"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
    <aside className="hidden xl:block xl:w-80 xl:sticky xl:top-6 xl:h-[calc(100vh-24px)] xl:overflow-y-auto xl:px-4">
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
                    href={`/topic/${topic.slug}`}
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
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
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
