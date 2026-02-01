import Link from "next/link";

export default function NotFound() {
  return (
    <div id="main-content" className="min-h-screen bg-ink flex flex-col items-center justify-center px-6" role="main">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-paper mb-2">404</h1>
        <p className="text-secondary text-lg mb-6">
          This page doesn’t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Back to home
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
