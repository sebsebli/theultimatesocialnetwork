"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PostItem } from "./post-item";
import { WhyLabel } from "./why-label";

interface Topic {
  id: string;
  slug: string;
  title: string;
  reasons?: string[];
}

interface Person {
  id: string;
  handle: string;
  displayName?: string;
  bio?: string;
  reasons?: string[];
}

import { Post } from "./post-item";

interface ExplorePost extends Post {
  reasons?: string[];
}

type TabData = {
  topics: Topic[];
  people: Person[];
  quoted: ExplorePost[];
  "deep-dives": ExplorePost[];
  newsroom: ExplorePost[];
};

export function ExploreContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "topics";
  const sort = searchParams.get("sort") || "recommended";

  const [tabData, setTabData] = useState<TabData>({
    topics: [],
    people: [],
    quoted: [],
    "deep-dives": [],
    newsroom: [],
  });
  const [loading, setLoading] = useState(false);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (sort) query.set("sort", sort);
      const queryString = query.toString() ? `?${query.toString()}` : "";

      const endpoints: Record<string, string> = {
        topics: "/api/explore/topics",
        people: "/api/explore/people",
        quoted: "/api/explore/quoted-now",
        "deep-dives": "/api/explore/deep-dives",
        newsroom: "/api/explore/newsroom",
      };

      const res = await fetch(`${endpoints[tab]}${queryString}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        setTabData((prev) => ({ ...prev, [tab]: items }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tab, sort]);

  useEffect(() => {
    // Only load if we don't have data for this tab/sort combo or if explicitly refreshing
    const key = tab as keyof TabData;
    if (tabData[key]?.length === 0) {
      loadContent();
    }
  }, [tab, sort, loadContent, tabData]);

  // Helper to get active items
  const activeItems =
    (tabData as unknown as Record<string, (Topic | Person | ExplorePost)[]>)[
      tab
    ] || [];

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-0 px-4 pt-2">
      <h3 className="text-xl font-bold leading-tight text-left text-paper tracking-tight px-4 mb-4">
        Discover
      </h3>

      {loading && activeItems.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary text-sm">Finding context...</p>
        </div>
      ) : activeItems.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-divider rounded-xl">
          <p className="text-secondary text-sm">
            No items found in this category.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tab === "topics" &&
            (activeItems as Topic[]).map((topic) => (
              <Link key={topic.id} href={`/topic/${topic.slug}`}>
                <div className="relative bg-white/[0.02] hover:bg-white/[0.05] flex flex-col items-stretch justify-end rounded-xl p-6 shadow-sm overflow-hidden border border-white/5 hover:border-primary/40 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-paper text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                      {topic.title}
                    </h4>
                    {topic.reasons && <WhyLabel reasons={topic.reasons} />}
                  </div>
                  <p className="text-secondary text-sm mb-4 max-w-sm">
                    Explore verified discussions and citations about{" "}
                    {topic.title.toLowerCase()}.
                  </p>
                  <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
                    View Topic
                    <svg
                      className="w-3 h-3 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}

          {tab === "people" &&
            (activeItems as Person[]).map((person) => (
              <Link key={person.id} href={`/user/${person.handle}`}>
                <div className="p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200 group active:scale-[0.99]">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-inner group-hover:bg-primary/30 transition-colors">
                      {person.displayName?.charAt(0) || person.handle.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-paper text-lg group-hover:text-primary transition-colors truncate">
                        {person.displayName || person.handle}
                      </div>
                      <div className="text-sm text-tertiary">
                        @{person.handle}
                      </div>
                      {person.bio && (
                        <div className="text-sm text-secondary mt-1 line-clamp-1">
                          {person.bio}
                        </div>
                      )}
                    </div>
                    {person.reasons && <WhyLabel reasons={person.reasons} />}
                  </div>
                </div>
              </Link>
            ))}

          {(tab === "quoted" || tab === "deep-dives" || tab === "newsroom") &&
            (activeItems as ExplorePost[]).map((post) => (
              <div key={post.id} className="relative group">
                <PostItem post={post} />
                {post.reasons && (
                  <div className="absolute top-4 right-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <WhyLabel reasons={post.reasons} />
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
