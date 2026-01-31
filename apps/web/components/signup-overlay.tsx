"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth-provider";

const DISMISSED_AT_KEY = "signup_overlay_dismissed_at";
const VIEWS_SINCE_DISMISS_KEY = "signup_overlay_views_since_dismiss";
const RE_SHOW_AFTER_VIEWS = 2;

/** Public routes that have "content" and should show the signup overlay when not authenticated */
const PUBLIC_CONTENT_PATHS = [
  "/",
  "/welcome",
  "/manifesto",
  "/roadmap",
  "/waiting-list",
];

/** Public routes where we do NOT show the overlay (auth flows, legal, etc.) */
const NO_OVERLAY_PATHS = [
  "/sign-in",
  "/verify",
  "/privacy",
  "/terms",
  "/imprint",
  "/ai-transparency",
  "/invites",
];

function isPublicContentPage(pathname: string): boolean {
  if (
    NO_OVERLAY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  )
    return false;
  return PUBLIC_CONTENT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function getSessionStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setSessionStorage(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function SignupOverlay() {
  const t = useTranslations("signupOverlay");
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    const schedule = (fn: () => void) => queueMicrotask(fn);

    if (!mounted || isLoading || isAuthenticated) {
      schedule(() => setVisible(false));
      return;
    }

    if (!isPublicContentPage(pathname)) {
      schedule(() => setVisible(false));
      return;
    }

    const dismissedAt = getSessionStorage(DISMISSED_AT_KEY);
    const viewsSince = parseInt(
      getSessionStorage(VIEWS_SINCE_DISMISS_KEY) ?? "0",
      10,
    );

    if (dismissedAt === null || dismissedAt === "") {
      schedule(() => setVisible(true));
      return;
    }

    // They dismissed before; increment view count on this navigation
    const newViews = viewsSince + 1;
    setSessionStorage(VIEWS_SINCE_DISMISS_KEY, String(newViews));

    if (newViews >= RE_SHOW_AFTER_VIEWS) {
      schedule(() => setVisible(true));
      setSessionStorage(VIEWS_SINCE_DISMISS_KEY, "0");
      setSessionStorage(DISMISSED_AT_KEY, "");
    } else {
      schedule(() => setVisible(false));
    }
  }, [mounted, isLoading, isAuthenticated, pathname]);

  const dismiss = () => {
    setVisible(false);
    setSessionStorage(DISMISSED_AT_KEY, String(Date.now()));
    setSessionStorage(VIEWS_SINCE_DISMISS_KEY, "0");
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Sign up to join Citewalk"
        className="fixed left-1/2 top-1/2 z-[91] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#1A1A1D] bg-[#0B0B0C] p-6 shadow-xl animate-in fade-in duration-300"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 p-1 text-[#6E6E73] hover:text-[#F2F2F2] rounded transition-colors"
          aria-label={t("closeAria")}
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="pt-2">
          <h2 className="text-xl font-serif font-normal text-[#F2F2F2] mb-2">
            {t("title")}
          </h2>
          <p className="text-sm text-[#A8A8AA] mb-6">{t("description")}</p>

          <div className="flex flex-col gap-3">
            <Link
              href="/sign-in"
              className="flex justify-center items-center px-4 py-3 bg-[#F2F2F2] text-[#0B0B0C] font-medium rounded-xl hover:bg-white transition-colors"
            >
              {t("signInUp")}
            </Link>
            <Link
              href="/waiting-list"
              className="flex justify-center items-center px-4 py-3 border border-[#333] text-[#A8A8AA] text-sm rounded-xl hover:border-[#555] hover:text-[#F2F2F2] transition-colors"
            >
              {t("joinWaitlist")}
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="text-sm text-[#6E6E73] hover:text-[#A8A8AA] py-2"
            >
              {t("notNow")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
