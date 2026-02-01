"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Error boundary:", error);
    }
  }, [error]);

  return (
    <div id="main-content" className="min-h-screen bg-ink flex flex-col items-center justify-center px-6" role="main">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-paper mb-2">Something went wrong</h1>
        <p className="text-secondary mb-6">
          We’ve been notified and are looking into it. You can try again or go
          back home.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="min-h-[44px] px-6 py-3 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Try again
          </button>
          <Link
            href="/"
            className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/20 text-paper font-medium hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
