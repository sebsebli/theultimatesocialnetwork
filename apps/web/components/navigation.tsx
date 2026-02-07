"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "./auth-provider";
import { useUnreadMessages } from "@/context/unread-messages-context";
import { useExplorationTrail } from "@/context/exploration-trail";

export function Navigation() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const { clearTrail } = useExplorationTrail();

  const handle = (user as { handle?: string } | null)?.handle ?? "me";

  const isActive = (path: string) => {
    if (path === "/home") {
      return pathname === "/home";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-ink/90 backdrop-blur-lg border-t border-divider z-50 md:hidden safe-area-pb"
      aria-label="Primary"
    >
      <div className="max-w-[680px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/home"
          aria-label={t("home")}
          aria-current={isActive("/home") ? "page" : undefined}
          onClick={() => clearTrail()}
          className={`flex flex-col items-center justify-center w-12 h-full min-h-[44px] transition-all duration-200 ${
            isActive("/home")
              ? "text-primary scale-110"
              : "text-tertiary hover:text-paper"
          }`}
        >
          <svg
            className="w-6 h-6 mt-1"
            fill={isActive("/home") ? "currentColor" : "none"}
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
          <span
            className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-opacity ${isActive("/home") ? "opacity-100" : "opacity-0"}`}
          >
            {t("home")}
          </span>
        </Link>
        <Link
          href="/explore"
          aria-label={t("discover")}
          aria-current={isActive("/explore") ? "page" : undefined}
          onClick={() => clearTrail()}
          className={`flex flex-col items-center justify-center w-12 h-full min-h-[44px] transition-all duration-200 ${
            isActive("/explore")
              ? "text-primary scale-110"
              : "text-tertiary hover:text-paper"
          }`}
        >
          <svg
            className="w-6 h-6 mt-1"
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
          <span
            className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-opacity ${isActive("/explore") ? "opacity-100" : "opacity-0"}`}
          >
            {t("discover")}
          </span>
        </Link>
        <Link
          href="/compose"
          aria-label={t("post")}
          className="flex flex-col items-center justify-center w-14 h-full min-h-[44px] transition-transform active:scale-95"
        >
          <div className="w-11 h-11 rounded-full bg-primary border-2 border-ink flex items-center justify-center shadow-lg group hover:opacity-90 transition-opacity">
            <svg
              className="w-6 h-6 text-ink"
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
        </Link>
        <Link
          href="/inbox"
          aria-label={
            unreadCount > 0
              ? `${t("chats")} (${unreadCount} unread)`
              : t("chats")
          }
          aria-current={isActive("/inbox") ? "page" : undefined}
          onClick={() => clearTrail()}
          className={`relative flex flex-col items-center justify-center w-12 h-full min-h-[44px] transition-all duration-200 ${
            isActive("/inbox")
              ? "text-primary scale-110"
              : "text-tertiary hover:text-paper"
          }`}
        >
          <svg
            className="w-6 h-6 mt-1"
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
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1/4 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-ink text-[10px] font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span
            className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-opacity ${isActive("/inbox") ? "opacity-100" : "opacity-0"}`}
          >
            {t("chats")}
          </span>
        </Link>
        <Link
          href={`/user/${handle}`}
          aria-label={t("profile")}
          aria-current={isActive(`/user/${handle}`) ? "page" : undefined}
          onClick={() => clearTrail()}
          className={`flex flex-col items-center justify-center w-12 h-full min-h-[44px] transition-all duration-200 ${
            isActive(`/user/${handle}`)
              ? "text-primary scale-110"
              : "text-tertiary hover:text-paper"
          }`}
        >
          <svg
            className="w-6 h-6 mt-1"
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
          <span
            className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-opacity ${isActive(`/user/${handle}`) ? "opacity-100" : "opacity-0"}`}
          >
            {t("profile")}
          </span>
        </Link>
      </div>
    </nav>
  );
}
