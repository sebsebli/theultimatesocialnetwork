"use client";

import { useState, Suspense, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PostItem, type Post } from "@/components/post-item";
import { UserCard } from "@/components/user-card";
import { TopicCard } from "@/components/topic-card";

type SearchTab = "all" | "posts" | "people" | "topics";

const PAGE_SIZE = 10;
const ALL_PAGE_SIZE = 6;
const DEBOUNCE_MS = 350;

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
    users: {
      id: string;
      handle: string;
      displayName?: string;
      bio?: string;
      [key: string]: unknown;
    }[];
    topics: {
      id: string;
      slug: string;
      title: string;
      [key: string]: unknown;
    }[];
  }>({
    posts: [],
    users: [],
    topics: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState({ posts: true, users: true, topics: true });
  const [offsets, setOffsets] = useState({ posts: 0, users: 0, topics: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef(activeTab);
  const handleSearchRef = useRef(handleSearch);
  activeTabRef.current = activeTab;
  handleSearchRef.current = handleSearch;

  const normalizeTopic = (t: { id?: string; title?: string; slug?: string; [key: string]: unknown }) => ({
    ...t,
    slug: t.slug ?? t.id ?? "",
    title: t.title ?? t.slug ?? "",
  });

  const handleSearch = useCallback(
    async (searchQuery: string, type: SearchTab, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const limit = type === "all" && !topicSlug ? ALL_PAGE_SIZE : PAGE_SIZE;
      const offset = append
        ? type === "posts" || topicSlug
          ? results.posts.length
          : type === "people"
            ? results.users.length
            : results.topics.length
        : 0;
      try {
        if (type === "all" && !topicSlug) {
          if (append) {
            const [resPosts, resUsers, resTopics] = await Promise.all([
              fetch(
                `/api/search/posts?q=${encodeURIComponent(searchQuery)}&limit=${limit}&offset=${results.posts.length}`,
              ),
              fetch(
                `/api/search/users?q=${encodeURIComponent(searchQuery)}&limit=${limit}&offset=${results.users.length}`,
              ),
              fetch(
                `/api/search/topics?q=${encodeURIComponent(searchQuery)}&limit=${limit}&offset=${results.topics.length}`,
              ),
            ]);
            const posts = resPosts.ok ? (await resPosts.json()).hits || [] : [];
            const users = resUsers.ok ? (await resUsers.json()).hits || [] : [];
            const rawTopics = resTopics.ok ? (await resTopics.json()).hits || [] : [];
            const topics = rawTopics.map(normalizeTopic);
            setResults((prev) => ({
              posts: [...prev.posts, ...posts],
              users: [...prev.users, ...users],
              topics: [...prev.topics, ...topics],
            }));
            setHasMore({
              posts: posts.length >= limit,
              users: users.length >= limit,
              topics: topics.length >= limit,
            });
          } else {
            const res = await fetch(
              `/api/search/all?q=${encodeURIComponent(searchQuery)}&limit=${limit}`,
            );
            if (res.ok) {
              const data = await res.json();
              const posts = data.posts || [];
              const users = data.users || [];
              const topics = (data.topics || []).map(normalizeTopic);
              setResults({ posts, users, topics });
              setHasMore({
                posts: posts.length >= limit,
                users: users.length >= limit,
                topics: topics.length >= limit,
              });
            }
          }
        } else if (type === "posts" || topicSlug) {
          const topicParam = topicSlug ? `&topicSlug=${encodeURIComponent(topicSlug)}` : "";
          const res = await fetch(
            `/api/search/posts?q=${encodeURIComponent(searchQuery)}&limit=${limit}&offset=${offset}${topicParam}`,
          );
          if (res.ok) {
            const data = await res.json();
            const hits = data.hits || [];
            setResults((prev) =>
              append ? { ...prev, posts: [...prev.posts, ...hits] } : { ...prev, posts: hits, users: [], topics: [] },
            );
            setHasMore((h) => ({ ...h, posts: hits.length >= limit }));
            if (!append) setOffsets((o) => ({ ...o, posts: hits.length }));
            else setOffsets((o) => ({ ...o, posts: o.posts + hits.length }));
          }
        } else if (type === "people") {
          const res = await fetch(
            `/api/search/users?q=${encodeURIComponent(searchQuery)}&limit=${limit}&offset=${offset}`,
          );
          if (res.ok) {
            const data = await res.json();
            const hits = data.hits || [];
            setResults((prev) =>
              append ? { ...prev, users: [...prev.users, ...hits] } : { ...prev, users: hits, posts: [], topics: [] },
            );
            setHasMore((h) => ({ ...h, users: hits.length >= limit }));
            if (!append) setOffsets((o) => ({ ...o, users: hits.length }));
            else setOffsets((o) => ({ ...o, users: o.users + hits.length }));
          }
        } else if (type === "topics") {
          const res = await fetch(
            `/api/search/topics?q=${encodeURIComponent(searchQuery)}&limit=${limit}&offset=${offset}`,
          );
          if (res.ok) {
            const data = await res.json();
            const hits = (data.hits || []).map(normalizeTopic);
            setResults((prev) =>
              append ? { ...prev, topics: [...prev.topics, ...hits] } : { ...prev, topics: hits, posts: [], users: [] },
            );
            setHasMore((h) => ({ ...h, topics: hits.length >= limit }));
            if (!append) setOffsets((o) => ({ ...o, topics: hits.length }));
            else setOffsets((o) => ({ ...o, topics: o.topics + hits.length }));
          }
        }
      } catch (error) {
        console.error("Search error", error);
        if (!append) setResults({ posts: [], users: [], topics: [] });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [topicSlug, results.posts.length, results.users.length, results.topics.length],
  );

  // Debounce: only run search after user stops typing (do not depend on handleSearch to avoid reset after load more)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults({ posts: [], users: [], topics: [] });
      setOffsets({ posts: 0, users: 0, topics: 0 });
      setHasMore({ posts: true, users: true, topics: true });
      return;
    }
    debounceRef.current = setTimeout(() => {
      setOffsets({ posts: 0, users: 0, topics: 0 });
      handleSearchRef.current(query, activeTabRef.current, false);
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const onTabChange = useCallback(
    (tab: SearchTab) => {
      setActiveTab(tab);
      if (query.trim()) {
        setOffsets({ posts: 0, users: 0, topics: 0 });
        handleSearch(query, tab, false);
      }
    },
    [query, handleSearch],
  );

  const loadMore = useCallback(() => {
    if (loadingMore || loading) return;
    const more =
      activeTab === "all"
        ? hasMore.posts || hasMore.users || hasMore.topics
        : activeTab === "posts"
          ? hasMore.posts
          : activeTab === "people"
            ? hasMore.users
            : hasMore.topics;
    if (!more) return;
    handleSearch(query, activeTab, true);
  }, [activeTab, loadingMore, loading, hasMore, query, handleSearch]);

  const tabs: SearchTab[] = ["all", "posts", "people", "topics"];

  return (
    <>
      {/* Header / Search */}
      <div className="px-4 md:px-6 py-3 sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-divider">
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
              className="w-full min-h-[3rem] pl-12 pr-4 py-3 leading-normal text-paper placeholder-tertiary bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
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
                onClick={() => onTabChange(tab)}
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
                  <div className="px-4 py-4 space-y-2">
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
                <div ref={loadMoreRef} className="h-4 flex-shrink-0" aria-hidden />
                {activeTab === "posts" && hasMore.posts && loadingMore && (
                  <div className="py-4 flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                {activeTab === "people" && hasMore.users && loadingMore && (
                  <div className="py-4 flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </>
            )}
            <div ref={loadMoreRef} className="h-4 flex-shrink-0" aria-hidden />
            {loadingMore && (
              <div className="py-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
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
