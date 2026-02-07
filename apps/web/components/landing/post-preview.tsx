"use client";

import { useEffect, useState } from "react";

/**
 * Animated post preview for the landing page hero section.
 * Mirrors the actual PostItem + PostConnections UX from the product.
 * Uses the same design tokens (bg-ink, border-divider, text-paper, etc.)
 *
 * Topics use Citewalk's [[ ]] bracket syntax, NOT Twitter-style hashtags.
 */

/** Topic icon — renders [[ ]] brackets (Citewalk's identity, not #) */
function TopicIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <span
      className={`${className} inline-flex items-center justify-center font-mono font-bold text-[0.6em] leading-none`}
    >
      [[]]
    </span>
  );
}

export function PostPreview() {
  const [visible, setVisible] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showTrail, setShowTrail] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 300);
    const t2 = setTimeout(() => setShowConnections(true), 1200);
    const t3 = setTimeout(() => setShowTrail(true), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto relative">
      {/* Exploration Trail */}
      <div
        className={`mb-3 transition-all duration-700 ${showTrail ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
      >
        <div className="flex items-center gap-1 px-4 py-2 bg-[var(--background)]/95 backdrop-blur-md border border-[var(--divider)] rounded-lg text-[11px] overflow-hidden">
          {/* Home icon */}
          <span className="shrink-0 p-1 text-[var(--secondary)]">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </span>
          <svg
            className="w-3 h-3 text-[var(--tertiary)] mx-0.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded text-[var(--tertiary)]">
            <span className="text-[var(--primary)] font-mono text-[10px]">
              [[
            </span>
            Sourdough
            <span className="text-[var(--primary)] font-mono text-[10px]">
              ]]
            </span>
          </span>
          <svg
            className="w-3 h-3 text-[var(--tertiary)] mx-0.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded text-[var(--foreground)] bg-white/10 truncate">
            <svg
              className="w-3 h-3"
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
            Rye Sourdough Starter
          </span>
        </div>
      </div>

      {/* Post Card — mirrors actual PostItem structure */}
      <div
        className={`bg-[var(--background)] border border-[var(--divider)] rounded-xl overflow-hidden shadow-2xl transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
      >
        {/* Author row — matches PostItem author meta */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[#9AA8B8] flex items-center justify-center text-[var(--background)] font-bold text-sm shrink-0">
            M
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-[var(--foreground)]">
              Maria Chen
            </span>
            <span className="text-[var(--tertiary)] text-xs">&middot;</span>
            <span className="text-[var(--tertiary)] text-xs font-mono">
              2h
            </span>
            <span className="text-[var(--tertiary)] text-xs">&middot;</span>
            <span className="text-[var(--tertiary)] text-xs">4 min</span>
          </div>
        </div>

        {/* Title — matches PostItem title style (28px like mobile) */}
        <div className="px-4 pb-2">
          <h3 className="text-[28px] font-bold leading-[36px] tracking-[-0.5px] text-[var(--foreground)]">
            Why Rye Sourdough Starter Changes Everything
          </h3>
        </div>

        {/* Body — matches PostItem prose style (serif like mobile) */}
        <div className="px-4 pb-4 text-[17px] leading-relaxed text-[var(--secondary)] font-serif">
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[var(--foreground)] font-sans text-xs font-semibold">
              <span className="text-[var(--primary)] font-mono text-[10px]">
                [[
              </span>
              Fermentation
              <span className="text-[var(--primary)] font-mono text-[10px]">
                ]]
              </span>
            </span>{" "}
            discussion and has implications for{" "}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[var(--foreground)] font-sans text-xs font-semibold">
              <span className="text-[var(--primary)] font-mono text-[10px]">
                [[
              </span>
              Bread
              <span className="text-[var(--primary)] font-mono text-[10px]">
                ]]
              </span>
            </span>{" "}
            bakers everywhere.
          </p>
        </div>

        {/* Connections section — mirrors PostConnections */}
        <div
          className={`border-t border-[var(--divider)] transition-all duration-700 ${showConnections
            ? "opacity-100 max-h-[600px]"
            : "opacity-0 max-h-0 overflow-hidden"
            }`}
        >
          {/* This builds on */}
          <div className="px-4 pt-4 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--tertiary)] mb-3">
              This builds on
            </h4>
            <div className="flex gap-3 overflow-hidden">
              {/* Post reference card */}
              <div className="shrink-0 w-[200px] bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[8px] text-white font-bold shrink-0">
                    J
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[var(--foreground)] font-medium truncate">
                      Jan Mueller
                    </div>
                    <div className="text-[10px] text-[var(--tertiary)] truncate">
                      @jan
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)] line-clamp-2 leading-tight">
                  Wheat Starter Guide
                </div>
                <span className="inline-flex items-center bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
                  12 cites
                </span>
              </div>

              {/* Topic reference card */}
              <div className="shrink-0 w-[200px] bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center shrink-0 border border-[var(--primary)]/30">
                    <span className="text-[var(--primary)] text-[9px] font-mono font-bold">
                      [[]]
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[var(--foreground)] font-medium truncate">
                      Sourdough
                    </div>
                    <div className="text-[10px] text-[var(--tertiary)]">
                      412 posts
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)] line-clamp-2 leading-tight">
                  Sourdough
                </div>
              </div>
            </div>
          </div>

          {/* Built upon by */}
          <div className="px-4 pt-2 pb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--tertiary)] mb-3">
              Built upon by{" "}
              <span className="text-[var(--secondary)]">3</span>
            </h4>
            <div className="flex gap-3 overflow-hidden">
              <div className="shrink-0 w-[220px] bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[8px] text-white font-bold shrink-0">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[var(--foreground)] font-medium truncate">
                      Alex Rivera
                    </div>
                    <div className="text-[10px] text-[var(--tertiary)] truncate">
                      @alex
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-[var(--foreground)] line-clamp-2 leading-tight">
                  Gluten-Free Sourdough
                </div>
                <div className="text-xs text-[var(--tertiary)] line-clamp-1">
                  Testing Maria&apos;s rye method with...
                </div>
              </div>
              <div className="shrink-0 w-[220px] bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[8px] text-white font-bold shrink-0">
                    S
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[var(--foreground)] font-medium truncate">
                      Sam Okafor
                    </div>
                    <div className="text-[10px] text-[var(--tertiary)] truncate">
                      @sam
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-[var(--foreground)] line-clamp-2 leading-tight">
                  Rye vs Wheat Comparison
                </div>
                <span className="inline-flex items-center bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mt-auto">
                  5 cites
                </span>
              </div>
            </div>
          </div>

          {/* In topics — using [[ ]] syntax instead of # */}
          <div className="px-4 pb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--tertiary)] mb-3">
              In topics
            </h4>
            <div className="flex gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                <span className="text-[var(--primary)] font-mono text-[10px] font-bold">
                  [[
                </span>
                <span className="font-medium text-[var(--foreground)]">
                  Sourdough
                </span>
                <span className="text-[var(--primary)] font-mono text-[10px] font-bold">
                  ]]
                </span>
                <span className="text-[var(--tertiary)]">&middot;</span>
                <span className="text-xs text-[var(--secondary)]">412</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                <span className="text-[var(--primary)] font-mono text-[10px] font-bold">
                  [[
                </span>
                <span className="font-medium text-[var(--foreground)]">
                  Bread
                </span>
                <span className="text-[var(--primary)] font-mono text-[10px] font-bold">
                  ]]
                </span>
                <span className="text-[var(--tertiary)]">&middot;</span>
                <span className="text-xs text-[var(--secondary)]">1.2k</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action bar — matches ActionButton row from PostItem */}
        <div className="px-4 py-2 border-t border-[var(--divider)] flex items-center justify-between">
          {/* Heart */}
          <span className="flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center text-[var(--tertiary)]">
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </span>
          {/* Comment */}
          <span className="flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center text-[var(--tertiary)]">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-xs">7</span>
          </span>
          {/* Quote */}
          <span className="flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center text-[var(--tertiary)]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
            </svg>
            <span className="text-xs">3</span>
          </span>
          {/* Bookmark */}
          <span className="flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center text-[var(--primary)]">
            <svg
              className="w-5 h-5"
              fill="currentColor"
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
          </span>
          {/* Share */}
          <span className="flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center text-[var(--tertiary)]">
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
