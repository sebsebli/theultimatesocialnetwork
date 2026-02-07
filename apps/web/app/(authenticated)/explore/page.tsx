"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import Link from "next/link";
import { ExploreSkeleton } from "@/components/skeletons";

const ExploreContent = dynamic(
  () =>
    import("@/components/explore-content").then((m) => ({
      default: m.ExploreContent,
    })),
  { ssr: false, loading: () => <ExploreSkeleton /> },
);
import { useSearchParams, useRouter } from "next/navigation";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "recommended", label: "Relevance" },
  { value: "newest", label: "Latest" },
  { value: "cited", label: "Most cited" },
];

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const activeTab = searchParams.get("tab") || "trending";
  const currentSort = searchParams.get("sort") || "recommended";

  const isActive = (tab: string) => activeTab === tab;

  const setSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", activeTab);
    if (sort !== "recommended") params.set("sort", sort);
    else params.delete("sort");
    router.replace(`/explore?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/search");
    }
  };

  const tabs: { id: string; label: string }[] = [
    { id: "trending", label: "Trending" },
    { id: "newest", label: "Latest" },
    { id: "quoted", label: "Quoted Now" },
    { id: "deep-dives", label: "Deep Dives" },
    { id: "newsroom", label: "Newsroom" },
    { id: "topics", label: "Topics" },
    { id: "people", label: "People" },
  ];

  return (
    <>
      {/* Header / Inline search — submit goes to /search?q= with filter tabs (all, people, topics, posts) */}
      <div className="px-4 md:px-6 py-3 bg-ink border-b border-divider">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative flex items-center">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => e.target.select?.()}
              placeholder="Search people, topics, or citations..."
              className="w-full min-h-[3rem] py-3 pl-12 pr-4 bg-white/5 border border-divider rounded-lg text-left text-paper placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-white/20 hover:border-white/20 transition-colors leading-normal"
              aria-label="Search people, topics, or citations"
            />
          </div>
          <Link
            href="/search"
            className="shrink-0 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-secondary hover:text-paper hover:bg-white/10 transition-colors text-sm font-medium"
          >
            All search
          </Link>
        </form>
      </div>

      {/* Tabs */}
      <div className="pt-1 pb-3 bg-ink border-b border-divider overflow-x-auto overflow-y-hidden min-w-0 no-scrollbar">
        <div className="flex flex-nowrap px-4 pr-4 gap-3 min-w-max">
          {tabs.map(({ id, label }) => (
            <Link
              key={id}
              href={`/explore?tab=${id}${currentSort !== "recommended" ? `&sort=${currentSort}` : ""}`}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-3 min-w-fit whitespace-nowrap ${isActive(id) ? "border-b-primary text-paper" : "border-b-transparent text-tertiary hover:text-primary transition-colors"}`}
            >
              <p className="text-[15px] font-semibold leading-normal tracking-tight">
                {label}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Sort Chips */}
      <div className="flex items-center gap-2 px-4 py-4 overflow-x-auto no-scrollbar">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`px-4 py-1.5 rounded-lg border text-sm font-semibold transition-colors whitespace-nowrap ${currentSort === opt.value
              ? "bg-white/5 border-primary text-primary"
              : "bg-white/5 border-divider text-tertiary hover:text-paper"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <ExploreContent />
    </>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink flex items-center justify-center text-secondary">
          Loading explore...
        </div>
      }
    >
      <ExplorePageContent />
    </Suspense>
  );
}
