"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserCard } from "@/components/user-card";
import { TopicCard } from "@/components/topic-card";

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
          return;
        }
        const data = await res.json();
        setTopics(Array.isArray(data) ? data : []);
        setItems([]);
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
      }
    } catch {
      setError(true);
      setItems([]);
      setTopics([]);
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

  const handleFollowTopic = async (topicSlug: string, follow: boolean) => {
    const method = follow ? "POST" : "DELETE";
    await fetch(`/api/topics/${encodeURIComponent(topicSlug)}/follow`, {
      method,
    });
  };

  return (
    <div className="min-h-screen bg-ink">
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

      {/* Tabs */}
      <div className="flex border-b border-divider">
        <Link
          href={`/user/${handle}/connections?tab=followers`}
          className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "followers"
              ? "text-primary border-b-2 border-primary"
              : "text-tertiary hover:text-paper"
          }`}
        >
          {t("followers")}
        </Link>
        <Link
          href={`/user/${handle}/connections?tab=following`}
          className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "following"
              ? "text-primary border-b-2 border-primary"
              : "text-tertiary hover:text-paper"
          }`}
        >
          {t("following")}
        </Link>
        <Link
          href={`/user/${handle}/connections?tab=topics`}
          className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "topics"
              ? "text-primary border-b-2 border-primary"
              : "text-tertiary hover:text-paper"
          }`}
        >
          {t("topics")}
        </Link>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <p className="text-secondary text-center py-8">Loading...</p>
        ) : error ? (
          <p className="text-secondary text-center py-8">
            Failed to load. User may be private.
          </p>
        ) : activeTab === "topics" ? (
          topics.length === 0 ? (
            <p className="text-secondary text-center py-8">
              Not following any topics yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onFollow={() =>
                    handleFollowTopic(topic.slug, !topic.isFollowing)
                  }
                />
              ))}
            </div>
          )
        ) : items.length === 0 ? (
          <p className="text-secondary text-center py-8">
            {activeTab === "followers"
              ? "No followers yet."
              : "Not following anyone yet."}
          </p>
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
      </div>
    </div>
  );
}
