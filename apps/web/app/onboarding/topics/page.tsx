"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getImageUrl } from "@/lib/security";

interface TopicRecentPost {
  id: string;
  title: string | null;
  bodyExcerpt: string;
  headerImageKey: string | null;
  author: { handle: string; displayName: string } | null;
  createdAt: string | null;
}

interface TopicSuggestion {
  id: string;
  slug: string;
  title: string;
  description?: string;
  postCount?: number;
  followerCount?: number;
  recentPostImageKey?: string | null;
  recentPostImageUrl?: string | null;
  headerImageKey?: string | null;
  imageKey?: string | null;
  imageUrl?: string | null;
  recentPost?: TopicRecentPost | null;
}

// Deterministic color from topic title for image-less cards
const TOPIC_COLORS = [
  "from-blue-900/40 to-blue-800/20",
  "from-emerald-900/40 to-emerald-800/20",
  "from-violet-900/40 to-violet-800/20",
  "from-amber-900/40 to-amber-800/20",
  "from-rose-900/40 to-rose-800/20",
  "from-cyan-900/40 to-cyan-800/20",
  "from-fuchsia-900/40 to-fuchsia-800/20",
  "from-teal-900/40 to-teal-800/20",
  "from-orange-900/40 to-orange-800/20",
  "from-indigo-900/40 to-indigo-800/20",
];

function getTopicColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length];
}

function getTopicImageUrl(topic: TopicSuggestion): string | null {
  const rp = topic.recentPost;
  if (rp?.headerImageKey) return getImageUrl(rp.headerImageKey);
  if (topic.recentPostImageUrl) return topic.recentPostImageUrl;
  if (topic.recentPostImageKey) return getImageUrl(topic.recentPostImageKey);
  if (topic.headerImageKey) return getImageUrl(topic.headerImageKey);
  if (topic.imageKey) return getImageUrl(topic.imageKey);
  if (topic.imageUrl) return topic.imageUrl;
  return null;
}

function getTopicExcerpt(topic: TopicSuggestion): string | null {
  const rp = topic.recentPost;
  if (rp?.title?.trim()) return rp.title.trim();
  if (rp?.bodyExcerpt?.trim()) return rp.bodyExcerpt.trim();
  if (topic.description?.trim()) return topic.description.trim();
  return null;
}

export default function OnboardingTopicsPage() {
  const router = useRouter();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [searchResults, setSearchResults] = useState<TopicSuggestion[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("onboarding_stage", "topics");
    }
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const res = await fetch("/api/explore/topics?sort=popular&limit=60", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        setTopics(items);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Server-side search for ALL topics
  const searchTopics = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/search/topics?q=${encodeURIComponent(query.trim())}&limit=40`,
        { credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        const hits = Array.isArray(data) ? data : data.hits || data.items || [];
        setSearchResults(hits);
      }
    } catch {
      // fall back to client-side filter
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimer.current !== null) clearTimeout(searchTimer.current);
      if (!value.trim() || value.trim().length < 2) {
        setSearchResults(null);
        setSearching(false);
        return;
      }
      setSearching(true);
      searchTimer.current = setTimeout(() => {
        searchTopics(value);
      }, 300);
    },
    [searchTopics],
  );

  // Use server results when available, client filter as fallback
  const displayTopics = useMemo(() => {
    if (searchResults !== null) return searchResults;
    if (!search.trim()) return topics;
    // Client-side fallback for very short queries
    const q = search.toLowerCase().trim();
    return topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false),
    );
  }, [topics, search, searchResults]);

  const toggleFollow = async (slug: string, topicId: string) => {
    const isFollowing = following.has(topicId);
    const newFollowing = new Set(following);
    if (isFollowing) {
      newFollowing.delete(topicId);
    } else {
      newFollowing.add(topicId);
    }
    setFollowing(newFollowing);

    try {
      const method = isFollowing ? "DELETE" : "POST";
      await fetch(`/api/topics/${encodeURIComponent(slug)}/follow`, {
        method,
        credentials: "include",
      });
    } catch {
      setFollowing(following); // revert
    }
  };

  const handleNext = () => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("onboarding_stage", "profile");
    }
    router.push("/onboarding/profile");
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Fixed header */}
      <div className="px-6 md:px-12 pt-8 md:pt-12 pb-4 max-w-3xl mx-auto w-full">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
              2
            </div>
            <span className="text-xs text-tertiary uppercase tracking-wider">
              Step 2 of 4
            </span>
          </div>
          <button
            onClick={handleNext}
            className="text-primary text-sm font-medium"
          >
            Skip
          </button>
        </div>

        <h1 className="text-3xl font-bold text-paper mb-2">
          What are you interested in?
        </h1>
        <p className="text-secondary mb-6 max-w-lg">
          Follow topics to fill your feed with ideas you care about. Every post
          tagged to a topic you follow will appear in your timeline.
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-11 pl-10 pr-10 bg-white/5 border border-white/10 rounded-lg text-paper text-sm tracking-normal placeholder:tracking-normal placeholder:text-tertiary placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Selection count + search indicator */}
        <div className="flex items-center justify-between mb-2">
          {following.size > 0 ? (
            <span className="text-sm text-primary font-medium">
              {following.size} topic{following.size !== 1 ? "s" : ""} selected
            </span>
          ) : (
            <span />
          )}
          {searching && (
            <span className="text-xs text-tertiary animate-pulse">
              Searching all topics...
            </span>
          )}
          {search.trim().length >= 2 &&
            searchResults !== null &&
            !searching && (
              <span className="text-xs text-tertiary">
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""}
              </span>
            )}
        </div>
      </div>

      {/* Scrollable topic grid */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-44">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[140px] bg-white/5 border border-white/10 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : displayTopics.length === 0 ? (
            <div className="text-center py-12 text-secondary text-sm">
              {search.trim()
                ? `No topics matching "${search}"`
                : "No topics available yet."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {displayTopics.map((topic) => {
                const isFollowed = following.has(topic.id);
                const imageUrl = getTopicImageUrl(topic);
                const excerpt = getTopicExcerpt(topic);
                const colorGradient = getTopicColor(topic.title);

                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleFollow(topic.slug, topic.id)}
                    className={`text-left rounded-xl border overflow-hidden transition-all relative group ${
                      isFollowed
                        ? "border-primary/50 ring-2 ring-primary/20"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Image or colored fallback */}
                    <div className="relative w-full h-[80px] overflow-hidden">
                      {imageUrl ? (
                        <>
                          <Image
                            src={imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
                        </>
                      ) : (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${colorGradient}`}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white/10 select-none">
                              #
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Check overlay */}
                      {isFollowed && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <div className="flex items-start gap-1 mb-1">
                        <span className="text-primary text-xs font-bold">
                          #
                        </span>
                        <span
                          className={`text-sm font-bold leading-tight line-clamp-1 ${
                            isFollowed ? "text-primary" : "text-paper"
                          }`}
                        >
                          {topic.title}
                        </span>
                      </div>

                      {/* Excerpt from recent post */}
                      {excerpt && (
                        <p className="text-[11px] text-secondary line-clamp-1 mb-1">
                          {excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="text-[11px] text-tertiary">
                        {topic.postCount
                          ? `${topic.postCount} post${topic.postCount !== 1 ? "s" : ""}`
                          : ""}
                        {topic.postCount && topic.followerCount
                          ? " \u00B7 "
                          : ""}
                        {topic.followerCount
                          ? `${topic.followerCount} follower${topic.followerCount !== 1 ? "s" : ""}`
                          : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-ink/95 backdrop-blur-md border-t border-divider px-6 md:px-12 py-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleNext}
            className={`w-full h-14 font-semibold rounded-lg transition-colors ${
              following.size >= 3
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-white/10 text-secondary"
            }`}
          >
            {following.size >= 3
              ? `Continue with ${following.size} topics`
              : `Select at least 3 topics (${following.size}/3)`}
          </button>
          <p className="mt-3 text-xs text-tertiary text-center pb-1">
            You can always change your topic follows later in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
