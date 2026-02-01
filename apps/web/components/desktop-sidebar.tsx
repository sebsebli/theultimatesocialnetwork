"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "./auth-provider";
import { useUnreadMessages } from "@/context/unread-messages-context";

function DesktopSidebarInner() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessages();

  const handle = (user as { handle?: string } | null)?.handle ?? "me";

  const isActive = (path: string) => {
    if (path === "/home") {
      return pathname === "/home";
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-56 lg:w-64 md:border-r md:border-divider md:sticky md:top-0 md:h-screen md:overflow-y-auto md:bg-ink shrink-0">
      <div className="flex flex-col p-3 lg:p-4 gap-2 pt-6">
        {/* Logo */}
        <Link
          href="/home"
          className="flex items-center gap-3 mb-6 px-3 py-2"
          aria-label="Citewalk Home"
        >
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image
              src="/logo_transparent.png"
              alt=""
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold text-paper">Citewalk</span>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          <Link
            href="/home"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive("/home") || pathname === "/home"
                ? "bg-primary/20 text-primary"
                : "text-tertiary hover:bg-white/5 hover:text-paper"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={isActive("/home") ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="font-medium">{t("home")}</span>
          </Link>

          <Link
            href="/explore"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive("/explore")
                ? "bg-primary/20 text-primary"
                : "text-tertiary hover:bg-white/5 hover:text-paper"
            }`}
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="font-medium">{t("discover")}</span>
          </Link>

          <Link
            href="/compose"
            className="flex items-center gap-3 px-3 py-3 mt-2 rounded-full bg-primary text-ink font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] group"
          >
            <div className="w-8 h-8 rounded-full bg-ink/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-ink"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
            <span className="font-bold tracking-tight">{t("post")}</span>
          </Link>

          <Link
            href="/inbox"
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive("/inbox")
                ? "bg-primary/20 text-primary"
                : "text-tertiary hover:bg-white/5 hover:text-paper"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={isActive("/inbox") ? "currentColor" : "none"}
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
            <span className="font-medium">{t("chats")}</span>
            {unreadCount > 0 && (
              <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-ink text-xs font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href={`/user/${handle}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive(`/user/${handle}`)
                ? "bg-primary/20 text-primary"
                : "text-tertiary hover:bg-white/5 hover:text-paper"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={isActive(`/user/${handle}`) ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="font-medium">{t("profile")}</span>
          </Link>
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-divider"></div>

        {/* Additional Links */}
        <div className="flex flex-col gap-1">
          <Link
            href="/collections"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive("/collections")
                ? "bg-primary/20 text-primary"
                : "text-tertiary hover:bg-white/5 hover:text-paper"
            }`}
          >
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
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <span className="text-sm font-medium">{t("collections")}</span>
          </Link>

          <Link
            href="/keeps"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive("/keeps")
                ? "bg-primary/20 text-primary"
                : "text-tertiary hover:bg-white/5 hover:text-paper"
            }`}
          >
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
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <span className="text-sm font-medium">{t("keeps")}</span>
          </Link>

          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive("/settings")
                ? "bg-primary/20 text-primary"
                : "text-tertiary hover:bg-white/5 hover:text-paper"
            }`}
          >
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm font-medium">{t("settings")}</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

export const DesktopSidebar = memo(DesktopSidebarInner);
