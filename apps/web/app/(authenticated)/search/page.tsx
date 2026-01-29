"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState<"people" | "topics" | "posts">(
    "people",
  );
  const [results, setResults] = useState<
    {
      id: string;
      handle?: string;
      displayName?: string;
      bio?: string;
      slug?: string;
      title?: string;
      body?: string;
      postCount?: number;
      author?: { handle: string; displayName: string };
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "posts") {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&type=posts`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } else if (activeTab === "people") {
        const res = await fetch(
          `/api/search/users?q=${encodeURIComponent(searchQuery)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data || []);
        }
      } else if (activeTab === "topics") {
        const res = await fetch(
          `/api/search/topics?q=${encodeURIComponent(searchQuery)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data || []);
        }
      }
    } catch (error) {
      console.error("Search error", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header / Search */}
      <div className="px-4 py-3 sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-divider">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-secondary hover:text-paper">
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
              onChange={(e) => {
                setQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search people, topics, or citations..."
              className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[72px] z-40 bg-ink border-b border-divider">
        <div className="flex px-6">
          {(["people", "topics", "posts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (query) handleSearch(query);
              }}
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

      {/* Results */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-secondary text-sm">Searching...</p>
          </div>
        ) : !query ? (
          <div className="text-center py-12">
            <p className="text-secondary text-sm">Start typing to search</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary text-sm">No results found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "people" &&
              results.map((user) => (
                <Link
                  key={user.id}
                  href={`/user/${user.handle}`}
                  className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      {(user.displayName || user.handle || '?').charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-paper">
                        {user.displayName || user.handle || 'Unknown'}
                      </div>
                      <div className="text-tertiary text-sm">
                        @{user.handle}
                      </div>
                      {user.bio && (
                        <div className="text-secondary text-sm mt-1">
                          {user.bio}
                        </div>
                      )}
                    </div>
                    <button className="px-4 py-2 border border-primary text-primary rounded-full hover:bg-primary/10 transition-colors text-sm">
                      Follow
                    </button>
                  </div>
                </Link>
              ))}

            {activeTab === "topics" &&
              results.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topic/${topic.slug}`}
                  className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="font-semibold text-paper mb-1">
                    {topic.title}
                  </div>
                  <div className="text-tertiary text-sm">
                    {topic.postCount} posts
                  </div>
                </Link>
              ))}

            {activeTab === "posts" &&
              results.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {post.title && (
                    <h3 className="font-semibold text-paper mb-2">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-secondary text-sm line-clamp-2">
                    {post.body}
                  </p>
                  <div className="text-tertiary text-xs mt-2">
                    @{post.author?.handle}
                  </div>
                </Link>
              ))}
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
