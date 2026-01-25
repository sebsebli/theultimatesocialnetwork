'use client';

import Link from 'next/link';

export function DesktopRightSidebar() {
  return (
    <aside className="hidden xl:block xl:w-80 xl:sticky xl:top-6 xl:h-[calc(100vh-24px)] xl:overflow-y-auto xl:px-4">
      <div className="flex flex-col gap-6 pt-6">
        {/* Trending Topics */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-bold text-paper mb-3 uppercase tracking-wider">Trending Topics</h3>
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Link
                key={i}
                href={`/topic/trending-${i}`}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-paper group-hover:text-primary transition-colors">
                    Trending Topic {i}
                  </p>
                  <p className="text-xs text-tertiary mt-1">1.2k posts</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recommended People */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-bold text-paper mb-3 uppercase tracking-wider">Who to Follow</h3>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  U{i}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-paper">User {i}</p>
                  <p className="text-xs text-tertiary">@user{i}</p>
                </div>
                <button className="px-3 py-1.5 text-xs font-semibold text-primary border border-primary rounded-full hover:bg-primary/10 transition-colors">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-2 text-xs text-tertiary">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link href="/imprint" className="hover:text-primary transition-colors">Imprint</Link>
        </div>
      </div>
    </aside>
  );
}
