"use client";

import Link from "next/link";
import Image from "next/image";
import { useRealtime } from "@/context/realtime-provider";

export function HomeHeader() {
  const { unreadNotifications } = useRealtime();

  return (
    <header className="sticky top-0 z-10 bg-ink border-b border-divider px-4 md:px-6 py-3 md:bg-ink/80 md:backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex-shrink-0 md:hidden">
            <Image
              src="/logo_transparent.png"
              alt=""
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-base md:text-lg font-bold tracking-tight text-paper">
            Home
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications (Mobile style) */}
          <Link
            href="/inbox" // On mobile this might go to inbox/notifications tab
            aria-label="Notifications"
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-tertiary hover:text-primary transition-colors rounded-lg relative"
          >
            <div className="relative">
              <svg
                className="w-6 h-6" // Increased size to match mobile header icon size
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-ink" />
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
