"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserCard } from "@/components/user-card";
import { TopicCard } from "@/components/topic-card";
import {
  EmptyState,
  emptyStateCenterClassName,
} from "@/components/ui/empty-state";

type Tab = "followers" | "following" | "topics";

interface Person {
  id: string;
  handle: string;
  displayName?: string;
  bio?: string;
  isFollowing?: boolean;
}

interface TopicItem {
  id: string;
  slug: string;
  title: string;
  postCount?: number;
  followerCount?: number;
  isFollowing?: boolean;
  recentPost?: {
    id: string;
    title: string | null;
    bodyExcerpt: string;
    headerImageKey: string | null;
    author: { handle: string; displayName: string } | null;
    createdAt: string | null;
  } | null;
  recentPostImageKey?: string | null;
}

export default function ConnectionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const handle = params.handle as string;
  const tabParam = searchParams.get("tab") as Tab | null;
  const t = useTranslations("profile");

  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam === "following"
      ? "following"
      : tabParam === "topics"
        ? "topics"
        : "followers",
  );
  const [items, setItems] = useState<Person[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topicSuggestions, setTopicSuggestions] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!handle) return;
    setLoading(true);
    setError(false);
    try {
      if (activeTab === "topics") {
        const res = await fetch(
          `/api/users/${encodeURIComponent(handle)}/followed-topics`,
        );
        if (!res.ok) {
          setError(true);
          setTopics([]);
          setTopicSuggestions([]);
          return;
        }
        const data = await res.json();
        const topicList = Array.isArray(data) ? data : [];
        setTopics(topicList);
        setItems([]);
        if (topicList.length === 0) {
          const sugRes = await fetch("/api/explore/topics?limit=6");
          if (sugRes.ok) {
            const sugData = await sugRes.json();
            setTopicSuggestions(
              Array.isArray(sugData) ? sugData : (sugData?.items ?? []),
            );
          } else {
            setTopicSuggestions([]);
          }
        } else {
          setTopicSuggestions([]);
        }
      } else {
        const endpoint = activeTab === "followers" ? "followers" : "following";
        const res = await fetch(
          `/api/users/${encodeURIComponent(handle)}/${endpoint}`,
        );
        if (!res.ok) {
          setError(true);
          setItems([]);
          return;
        }
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data.items || []);
        setTopics([]);
        setTopicSuggestions([]);
      }
    } catch {
      setError(true);
      setItems([]);
      setTopics([]);
      setTopicSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [handle, activeTab]);

  useEffect(() => {
    setActiveTab(
      tabParam === "following"
        ? "following"
        : tabParam === "topics"
          ? "topics"
          : "followers",
    );
  }, [tabParam]);

  const switchTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      const path = `/user/${encodeURIComponent(handle)}/connections`;
      window.history.replaceState(null, "", `${path}?tab=${tab}`);
    },
    [handle],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleFollow = async (person: Person) => {
    const prev = person.isFollowing;
    setItems((prevList) =>
      prevList.map((p) =>
        p.id === person.id ? { ...p, isFollowing: !prev } : p,
      ),
    );
    try {
      const res = await fetch(`/api/users/${person.id}/follow`, {
        method: prev ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setItems((prevList) =>
        prevList.map((p) =>
          p.id === person.id ? { ...p, isFollowing: prev } : p,
        ),
      );
    }
  };

  const handleFollowTopic = async (topic: TopicItem, follow: boolean) => {
    const method = follow ? "POST" : "DELETE";
    const res = await fetch(
      `/api/topics/${encodeURIComponent(topic.slug)}/follow`,
      {
        method,
      },
    );
    if (res.ok && follow) {
      setTopicSuggestions((prev) => prev.filter((t) => t.slug !== topic.slug));
      setTopics((prev) => [...prev, { ...topic, isFollowing: true }]);
    } else if (res.ok && !follow) {
      setTopics((prev) => prev.filter((t) => t.slug !== topic.slug));
    }
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href={`/user/${handle}`}
            className="p-2 text-tertiary hover:text-primary transition-colors"
          >
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
          <h1 className="text-xl font-bold text-paper">{t("connections")}</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Tabs — client-side switch + replaceState to avoid full page remount/flicker */}
      <div className="flex border-b border-divider">
        <button
          type="button"
          onClick={() => switchTab("followers")}
          className={`flex-1 px-4 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "followers"
              ? "text-primary border-b-2 border-primary"
              : "text-tertiary hover:text-paper"
          }`}
        >
          {t("followers")}
        </button>
        <button
          type="button"
          onClick={() => switchTab("following")}
          className={`flex-1 px-4 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "following"
              ? "text-primary border-b-2 border-primary"
              : "text-tertiary hover:text-paper"
          }`}
        >
          {t("following")}
        </button>
        <button
          type="button"
          onClick={() => switchTab("topics")}
          className={`flex-1 px-4 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "topics"
              ? "text-primary border-b-2 border-primary"
              : "text-tertiary hover:text-paper"
          }`}
        >
          {t("topics")}
        </button>
      </div>

      <div className="px-4 py-6 relative flex flex-col flex-1 min-h-[200px]">
        {loading && items.length === 0 && topics.length === 0 ? (
          <p className="text-secondary text-center py-8">Loading...</p>
        ) : error ? (
          <p className="text-secondary text-center py-8">
            Failed to load. User may be private.
          </p>
        ) : (
          <>
            {loading && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/30 overflow-hidden rounded-full">
                <div className="h-full w-1/3 bg-primary animate-pulse" />
              </div>
            )}
            {activeTab === "topics" ? (
              topics.length === 0 && topicSuggestions.length === 0 ? (
                <div className={emptyStateCenterClassName}>
                  <EmptyState
                    headline="Not following any topics yet"
                    subtext="Follow topics to see them here."
                    compact
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {topics.length > 0 &&
                    topics.map((topic) => (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        onFollow={() =>
                          handleFollowTopic(topic, !topic.isFollowing)
                        }
                      />
                    ))}
                  {topics.length === 0 && topicSuggestions.length > 0 && (
                    <>
                      <p className="text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">
                        Topics to follow
                      </p>
                      <div className="space-y-2">
                        {topicSuggestions.map((topic) => (
                          <TopicCard
                            key={topic.id}
                            topic={topic}
                            onFollow={() =>
                              handleFollowTopic(topic, !topic.isFollowing)
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            ) : items.length === 0 ? (
              <div className={emptyStateCenterClassName}>
                <EmptyState
                  headline={
                    activeTab === "followers"
                      ? "No followers yet"
                      : "Not following anyone yet"
                  }
                  subtext={
                    activeTab === "followers"
                      ? "When someone follows this profile, they will show up here."
                      : "Follow people to see them here."
                  }
                  compact
                />
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((person) => (
                  <UserCard
                    key={person.id}
                    person={person}
                    onFollow={() => handleFollow(person)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
