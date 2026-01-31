"use client";

import Link from "next/link";

export function InviteNudge() {
  return (
    <Link
      href="/invites"
      className="flex items-center w-full bg-primary p-4 rounded-xl hover:opacity-95 transition-opacity active:scale-[0.99]"
    >
      <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center mr-4 shrink-0 text-primary">
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
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-ink font-bold text-base mb-0.5">Invite Friends</h4>
        <p className="text-ink/80 text-sm font-medium">
          Build your network. Citewalk is better with friends.
        </p>
      </div>
      <div className="text-ink/60 shrink-0">
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
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
