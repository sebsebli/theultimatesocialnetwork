"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "./auth-provider";

export function DesktopSidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user } = useAuth();

  const handle = (user as { handle?: string } | null)?.handle ?? "me";

  const isActive = (path: string) => {
    if (path === "/home") {
      return pathname === "/home";
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-divider lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:bg-ink">
      <div className="flex flex-col p-4 gap-2 pt-6">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-3 mb-6 px-3 py-2">
          <div className="w-10 h-10 flex items-center justify-center text-primary">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M11 5H7C4.5 9 4.5 15 7 19H11"></path>
              <path d="M13 5H17V19H13"></path>
            </svg>
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
              fill={isActive("/") && pathname === "/" ? "currentColor" : "none"}
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
            className="flex items-center gap-3 px-3 py-3 mt-2 rounded-full bg-primary text-white hover:bg-primaryDark transition-all shadow-lg shadow-primary/20 active:scale-[0.98] group"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="font-bold tracking-tight">{t("post")}</span>
          </Link>

          <Link
            href="/inbox"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive("/inbox")
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="font-medium">{t("activity")}</span>
          </Link>

          <Link
            href={`/user/${handle}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive(`/user/${handle}`)
                ? "bg-primary/20 text-primary"
                : "text-tertiary hover:bg-white/5 hover:text-paper"
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-[10px]">
              {handle.charAt(0).toUpperCase()}
            </div>
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
