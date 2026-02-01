"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { isBetaActive } from "@/lib/feature-flags";

export function SignupOverlay() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [scrollReached, setScrollReached] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show on content pages
  const shouldShow = ["/", "/manifesto", "/roadmap"].includes(pathname);

  // Derive visibility: no synchronous setState in effect
  const visible =
    shouldShow && !isLoading && !isAuthenticated && !dismissed && scrollReached;

  useEffect(() => {
    if (!shouldShow || isLoading || isAuthenticated || dismissed) {
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollPercent =
        scrollHeight - clientHeight > 0
          ? (scrollY / (scrollHeight - clientHeight)) * 100
          : 0;

      if (scrollY > 800 || scrollPercent > 30) {
        setScrollReached(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldShow, isLoading, isAuthenticated, dismissed]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] animate-in slide-in-from-bottom-full duration-500">
      {/* Blurry Backdrop (Gradient fade) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/95 to-transparent h-[120%] -top-[20%] pointer-events-none backdrop-blur-md" />

      <div className="relative z-[91] max-w-[1200px] mx-auto px-6 pb-8 pt-12 md:pb-12 md:pt-16 flex flex-col md:flex-row items-center justify-between gap-6">
        <button
          onClick={() => {
            setDismissed(true);
          }}
          className="absolute top-4 right-6 md:top-8 md:right-8 p-2 text-[#6E6E73] hover:text-[#F2F2F2] transition-colors bg-[#1A1A1D]/50 hover:bg-[#1A1A1D] rounded-full"
          aria-label="Close"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex-1 max-w-xl">
          <h3 className="text-2xl md:text-3xl font-serif text-[#F2F2F2] mb-3">
            The network is waiting.
          </h3>
          <p className="text-[#A8A8AA] text-lg leading-relaxed">
            {isBetaActive
              ? "Join the closed beta to start building your knowledge graph."
              : "Join the network to start building your knowledge graph."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Link
            href={isBetaActive ? "/waiting-list" : "/sign-in"}
            className="inline-flex justify-center items-center px-8 py-4 bg-[#F2F2F2] text-[#0B0B0C] font-semibold text-lg rounded-full hover:bg-white transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.2)]"
          >
            {isBetaActive ? "Join the Waiting List" : "Join the Network"}
          </Link>
          <button
            onClick={() => {
              setDismissed(true);
            }}
            className="inline-flex justify-center items-center px-8 py-4 border border-[#333] text-[#A8A8AA] font-medium text-lg rounded-full hover:border-[#666] hover:text-[#F2F2F2] transition-colors"
          >
            Continue Reading
          </button>
        </div>
      </div>
    </div>
  );
}
