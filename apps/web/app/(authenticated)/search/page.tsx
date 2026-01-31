"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PostItem, type Post } from "@/components/post-item";
import { UserCard } from "@/components/user-card";
import { TopicCard } from "@/components/topic-card";

type SearchTab = "all" | "posts" | "people" | "topics";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialTab = (searchParams.get("type") as SearchTab) || "all";
  const topicSlug = searchParams.get("topicSlug");

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>(
    topicSlug ? "posts" : initialTab,
  );
  const [results, setResults] = useState<{
    posts: Post[];
    users: { id: string; [key: string]: unknown }[];
    topics: {
      id: string;
      title?: string;
      slug?: string;
      [key: string]: unknown;
    }[];
  }>({
    posts: [],
    users: [],
    topics: [],
  });
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(
    async (searchQuery: string, type: SearchTab) => {
      setLoading(true);
      try {
        if (type === "all" && !topicSlug) {
          const res = await fetch(
            `/api/search/all?q=${encodeURIComponent(searchQuery)}&limit=5`,
          );
          if (res.ok) {
            const data = await res.json();
            setResults({
              posts: data.posts || [],
              users: data.users || [],
              topics: (data.topics || []).map(
                (t: {
                  title?: string;
                  slug?: string;
                  [key: string]: unknown;
                }) => ({
                  ...t,
                  title: t.title || t.slug,
                }),
              ),
            });
          }
        } else if (type === "posts" || topicSlug) {
          const topicParam = topicSlug
            ? `&topicSlug=${encodeURIComponent(topicSlug)}`
            : "";
          const res = await fetch(
            `/api/search/posts?q=${encodeURIComponent(searchQuery)}${topicParam}`,
          );
          if (res.ok) {
            const data = await res.json();
            setResults({
              posts: data.hits || [],
              users: [],
              topics: [],
            });
          }
        } else if (type === "people") {
          const res = await fetch(
            `/api/search/users?q=${encodeURIComponent(searchQuery)}`,
          );
          if (res.ok) {
            const data = await res.json();
            setResults({
              posts: [],
              users: data.hits || [],
              topics: [],
            });
          }
        } else if (type === "topics") {
          const res = await fetch(
            `/api/search/topics?q=${encodeURIComponent(searchQuery)}`,
          );
          if (res.ok) {
            const data = await res.json();
            setResults({
              posts: [],
              users: [],
              topics: (data.hits || []).map(
                (t: {
                  title?: string;
                  slug?: string;
                  [key: string]: unknown;
                }) => ({
                  ...t,
                  title: t.title || t.slug,
                }),
              ),
            });
          }
        }
      } catch (error) {
        console.error("Search error", error);
        setResults({ posts: [], users: [], topics: [] });
      } finally {
        setLoading(false);
      }
    },
    [topicSlug],
  );

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query, activeTab);
      } else {
        setResults({ posts: [], users: [], topics: [] });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab, topicSlug, handleSearch]);

  const tabs: SearchTab[] = ["all", "posts", "people", "topics"];

  return (
    <>
      {/* Header / Search */}
      <div className="px-4 py-3 sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-divider">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-secondary hover:text-paper"
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
          </button>
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                topicSlug
                  ? "Search within this topic..."
                  : "Search people, topics, or posts..."
              }
              className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Tabs - Hide if scoped to topic */}
      {!topicSlug && (
        <div className="sticky top-[72px] z-40 bg-ink border-b border-divider">
          <div className="flex px-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "border-primary text-paper"
                    : "border-transparent text-tertiary hover:text-paper"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topic Scope Indicator */}
      {topicSlug && (
        <div className="px-4 py-2 bg-white/5 border-b border-divider">
          <p className="text-secondary text-sm">
            Searching within <strong>{topicSlug}</strong>
          </p>
        </div>
      )}

      {/* Results */}
      <div className="pb-20">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary text-sm">Searching...</p>
          </div>
        ) : !query ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-secondary text-sm">
              Start typing to search {topicSlug ? "in this topic" : "Citewalk"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {activeTab === "all" && !topicSlug ? (
              <>
                {results.posts.length > 0 && (
                  <div>
                    <div className="px-4 py-3 bg-ink border-b border-divider">
                      <h3 className="text-xs font-bold text-tertiary uppercase tracking-wider">
                        Posts
                      </h3>
                    </div>
                    {results.posts.map((post) => (
                      <PostItem key={post.id} post={post} />
                    ))}
                  </div>
                )}
                {results.users.length > 0 && (
                  <div>
                    <div className="px-4 py-3 bg-ink border-b border-divider">
                      <h3 className="text-xs font-bold text-tertiary uppercase tracking-wider">
                        People
                      </h3>
                    </div>
                    <div className="px-4 py-2 space-y-2">
                      {results.users.map((user) => (
                        <UserCard key={user.id} person={user} />
                      ))}
                    </div>
                  </div>
                )}
                {results.topics.length > 0 && (
                  <div>
                    <div className="px-4 py-3 bg-ink border-b border-divider">
                      <h3 className="text-xs font-bold text-tertiary uppercase tracking-wider">
                        Topics
                      </h3>
                    </div>
                    <div className="px-4 py-2 space-y-2">
                      {results.topics.map((topic) => (
                        <TopicCard key={topic.id} topic={topic} />
                      ))}
                    </div>
                  </div>
                )}
                {results.posts.length === 0 &&
                  results.users.length === 0 &&
                  results.topics.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-secondary text-sm">No results found</p>
                    </div>
                  )}
              </>
            ) : (
              // Specific Tabs
              <>
                {activeTab === "posts" && (
                  <div>
                    {results.posts.length > 0 ? (
                      results.posts.map((post) => (
                        <PostItem key={post.id} post={post} />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-secondary text-sm">
                          No posts found.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "people" && (
                  <div className="px-4 py-4 space-y-3">
                    {results.users.length > 0 ? (
                      results.users.map((user) => (
                        <UserCard key={user.id} person={user} />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-secondary text-sm">
                          No people found.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "topics" && (
                  <div className="px-4 py-4 space-y-3">
                    {results.topics.length > 0 ? (
                      results.topics.map((topic) => (
                        <TopicCard key={topic.id} topic={topic} />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-secondary text-sm">
                          No topics found.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink flex items-center justify-center text-secondary">
          Loading search...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
