"use client";

import { Suspense } from "react";
import { ExploreContent } from "@/components/explore-content";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "quoted";

  const isActive = (tab: string) => activeTab === tab;

  const tabs: { id: string; label: string }[] = [
    { id: "quoted", label: "Quoted Now" },
    { id: "deep-dives", label: "Deep Dives" },
    { id: "newsroom", label: "Newsroom" },
    { id: "topics", label: "Topics" },
    { id: "people", label: "People" },
  ];

  return (
    <>
      {/* Header / Search — tappable bar goes to /search like mobile */}
      <div className="px-4 md:px-6 py-3 sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-divider">
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="flex-1 relative flex items-center min-h-[3rem] py-3 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-left text-tertiary hover:bg-white/10 hover:border-white/20 transition-colors leading-normal"
            aria-label="Search people, topics, or citations"
          >
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
            <span className="text-base leading-normal">
              Search people, topics, or citations...
            </span>
          </Link>
        </div>
      </div>

      {/* Tabs — order and labels match mobile: quoted, deep-dives, newsroom, topics, people; scrollable so topics aren't cut off */}
      <div className="pt-1 pb-3 sticky top-[72px] z-40 bg-ink border-b border-divider overflow-x-auto overflow-y-hidden min-w-0 no-scrollbar">
        <div className="flex flex-nowrap px-4 gap-6 md:gap-8 min-w-max">
          {tabs.map(({ id, label }) => (
            <Link
              key={id}
              href={`/explore?tab=${id}`}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-3 min-w-fit whitespace-nowrap ${isActive(id) ? "border-b-primary text-paper" : "border-b-transparent text-tertiary hover:text-primary transition-colors"}`}
            >
              <p className="text-sm font-bold leading-normal tracking-tight">
                {label}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="flex justify-between items-center gap-2 px-4 py-4">
        <button
          type="button"
          aria-label="Filters"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-lg text-tertiary hover:text-primary hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Sort"
          className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full min-h-[44px] h-9 bg-white/5 border border-white/10 text-secondary gap-2 text-xs font-bold leading-normal tracking-tight min-w-0 px-4 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            />
          </svg>
          <span className="truncate">Sort Options</span>
        </button>
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
