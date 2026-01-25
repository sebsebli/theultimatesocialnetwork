'use client';

import { Suspense } from 'react';
import { ExploreContent } from '@/components/explore-content';
import { Navigation } from '@/components/navigation';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { DesktopRightSidebar } from '@/components/desktop-right-sidebar';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'topics';

  const isActive = (tab: string) => activeTab === tab;

  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider">
      {/* Header / Search */}
      <div className="px-4 py-3 sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-divider">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search people, topics, or citations..."
              className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary text-base"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pt-1 pb-3 sticky top-[72px] z-40 bg-ink border-b border-divider">
        <div className="flex px-4 gap-8 overflow-x-auto no-scrollbar">
          <Link href="/explore?tab=topics" className={`flex flex-col items-center justify-center border-b-[3px] pb-3 min-w-fit ${isActive('topics') ? 'border-b-primary text-paper' : 'border-b-transparent text-tertiary hover:text-primary transition-colors'}`}>
            <p className="text-sm font-bold leading-normal tracking-tight">Topics</p>
          </Link>
          <Link href="/explore?tab=people" className={`flex flex-col items-center justify-center border-b-[3px] pb-3 min-w-fit ${isActive('people') ? 'border-b-primary text-paper' : 'border-b-transparent text-tertiary hover:text-primary transition-colors'}`}>
            <p className="text-sm font-bold leading-normal tracking-tight">People</p>
          </Link>
          <Link href="/explore?tab=quoted" className={`flex flex-col items-center justify-center border-b-[3px] pb-3 min-w-fit ${isActive('quoted') ? 'border-b-primary text-paper' : 'border-b-transparent text-tertiary hover:text-primary transition-colors'}`}>
            <p className="text-sm font-bold leading-normal tracking-tight">Quoted Now</p>
          </Link>
          <Link href="/explore?tab=deep-dives" className={`flex flex-col items-center justify-center border-b-[3px] pb-3 min-w-fit ${isActive('deep-dives') ? 'border-b-primary text-paper' : 'border-b-transparent text-tertiary hover:text-primary transition-colors'}`}>
            <p className="text-sm font-bold leading-normal tracking-tight">Deep Dives</p>
          </Link>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="flex justify-between items-center gap-2 px-4 py-4">
        <button className="flex items-center justify-center p-2 rounded-lg text-tertiary hover:text-primary hover:bg-white/5 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
        <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-9 bg-white/5 border border-white/10 text-secondary gap-2 text-xs font-bold leading-normal tracking-tight min-w-0 px-4 hover:bg-white/10 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <span className="truncate">Sort Options</span>
        </button>
      </div>

      {/* Main Content */}
      <ExploreContent />
      
      <Navigation />
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink flex items-center justify-center text-secondary">Loading explore...</div>}>
      <ExplorePageContent />
    </Suspense>
  );
}