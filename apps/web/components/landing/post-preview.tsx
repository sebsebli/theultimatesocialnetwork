"use client";

import { useEffect, useState } from "react";

/**
 * Animated post preview for the landing page hero section.
 * Shows a realistic-looking post with inline connections, topic pills,
 * and the exploration trail — demonstrating the actual product UX.
 */
export function PostPreview() {
  const [visible, setVisible] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [showTrail, setShowTrail] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 300);
    const t2 = setTimeout(() => setShowConnections(true), 1200);
    const t3 = setTimeout(() => setShowTopics(true), 2000);
    const t4 = setTimeout(() => setShowTrail(true), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto relative">
      {/* Exploration Trail */}
      <div
        className={`mb-3 transition-all duration-700 ${
          showTrail ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-[#0F0F10] border border-[var(--divider)] rounded-lg text-[11px] overflow-hidden">
          <svg
            className="w-3.5 h-3.5 text-[var(--primary)] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0020 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span className="text-[var(--tertiary)]">Explore</span>
          <span className="text-[var(--tertiary)]">/</span>
          <span className="text-[var(--primary)] font-medium"># Sourdough</span>
          <span className="text-[var(--tertiary)]">/</span>
          <span className="text-[var(--foreground)] font-medium truncate">
            Rye Sourdough Starter
          </span>
        </div>
      </div>

      {/* Post Card */}
      <div
        className={`bg-[var(--background)] border border-[var(--divider)] rounded-xl overflow-hidden shadow-2xl transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Author */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[#9AA8B8] flex items-center justify-center text-[var(--background)] font-bold text-sm">
            M
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">
                Maria Chen
              </span>
              <span className="text-xs text-[var(--tertiary)]">&middot;</span>
              <span className="text-xs text-[var(--tertiary)]">2h ago</span>
              <span className="text-xs text-[var(--tertiary)]">&middot;</span>
              <span className="text-xs text-[var(--tertiary)]">4 min read</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="px-5 pb-2">
          <h3 className="text-xl font-bold text-[var(--foreground)] leading-tight">
            Why Rye Sourdough Starter Changes Everything
          </h3>
        </div>

        {/* Body */}
        <div className="px-5 pb-4 text-sm text-[var(--secondary)] leading-relaxed font-serif">
          <p>
            Building on{" "}
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--primary)] font-sans text-xs font-semibold">
              <svg
                className="w-3 h-3 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Jan&apos;s wheat starter guide
            </span>
            , I&apos;ve been experimenting with rye flour for three months. The
            difference in hydration and microbiome diversity is remarkable...
          </p>
          <p className="mt-3">
            This connects to the broader{" "}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] font-sans text-xs font-semibold">
              <span className="opacity-70">#</span>Fermentation
            </span>{" "}
            discussion and has implications for{" "}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] font-sans text-xs font-semibold">
              <span className="opacity-70">#</span>Bread
            </span>{" "}
            bakers everywhere.
          </p>
        </div>

        {/* Inline Connections */}
        <div
          className={`border-t border-[var(--divider)] transition-all duration-700 ${
            showConnections
              ? "opacity-100 max-h-[500px]"
              : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          {/* This builds on */}
          <div className="px-5 pt-4 pb-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--tertiary)] mb-2">
              This builds on
            </div>
            <div className="flex gap-2 overflow-hidden">
              <div className="shrink-0 w-[180px] bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[8px] text-white font-bold">
                    J
                  </div>
                  <span className="text-[var(--foreground)] font-medium text-[11px]">
                    Jan Mueller
                  </span>
                </div>
                <div className="text-[var(--foreground)] font-semibold text-[11px] line-clamp-1">
                  Wheat Starter Guide
                </div>
                <span className="inline-flex items-center bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1">
                  12 cites
                </span>
              </div>
              <div className="shrink-0 w-[180px] bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-[var(--primary)]/20 flex items-center justify-center border border-[var(--primary)]/30">
                    <span className="text-[var(--primary)] text-[9px] font-bold">
                      #
                    </span>
                  </div>
                  <span className="text-[var(--foreground)] font-medium text-[11px]">
                    Sourdough
                  </span>
                </div>
                <div className="text-[var(--tertiary)] text-[10px]">
                  412 posts
                </div>
              </div>
            </div>
          </div>

          {/* Built upon by */}
          <div className="px-5 pt-2 pb-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--tertiary)] mb-2">
              Built upon by <span className="text-[var(--secondary)]">3</span>
            </div>
            <div className="flex gap-2 overflow-hidden">
              <div className="shrink-0 w-[190px] bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[8px] text-white font-bold">
                    A
                  </div>
                  <span className="text-[var(--foreground)] font-medium text-[11px]">
                    Alex Rivera
                  </span>
                </div>
                <div className="text-[var(--foreground)] font-semibold text-[11px] line-clamp-1">
                  Gluten-Free Sourdough
                </div>
                <div className="text-[var(--tertiary)] text-[10px] line-clamp-1 mt-0.5">
                  Testing Maria&apos;s rye method with...
                </div>
              </div>
              <div className="shrink-0 w-[190px] bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[8px] text-white font-bold">
                    S
                  </div>
                  <span className="text-[var(--foreground)] font-medium text-[11px]">
                    Sam Okafor
                  </span>
                </div>
                <div className="text-[var(--foreground)] font-semibold text-[11px] line-clamp-1">
                  Rye vs Wheat Comparison
                </div>
                <span className="inline-flex items-center bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1">
                  5 cites
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Topics */}
        <div
          className={`px-5 pb-4 transition-all duration-700 ${
            showTopics
              ? "opacity-100 max-h-20"
              : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--tertiary)] mb-2">
            In topics
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--primary)]/5 border border-[var(--primary)]/20 text-xs">
              <span className="text-[var(--primary)] font-bold">#</span>
              <span className="text-[var(--foreground)] font-medium">
                Sourdough
              </span>
              <span className="text-[var(--tertiary)]">&middot;</span>
              <span className="text-[var(--tertiary)] text-[10px]">
                412 posts
              </span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--primary)]/5 border border-[var(--primary)]/20 text-xs">
              <span className="text-[var(--primary)] font-bold">#</span>
              <span className="text-[var(--foreground)] font-medium">
                Bread
              </span>
              <span className="text-[var(--tertiary)]">&middot;</span>
              <span className="text-[var(--tertiary)] text-[10px]">
                1.2k posts
              </span>
            </span>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-5 py-3 border-t border-[var(--divider)] flex items-center gap-6 text-[var(--tertiary)] text-xs">
          <span className="flex items-center gap-1.5">
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
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            3 cites
          </span>
          <span className="flex items-center gap-1.5">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            7 replies
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[var(--primary)] font-medium">
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
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            Keep
          </span>
        </div>
      </div>
    </div>
  );
}
