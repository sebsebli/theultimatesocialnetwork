"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "cookie_consent";

export type CookieConsent = "all" | "essential" | null;

export const COOKIE_CONSENT_CLOSED_EVENT = "cookie-consent-closed";

function readStoredConsent(): CookieConsent {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as CookieConsent | null;
    return stored === "all" || stored === "essential" ? stored : null;
  } catch {
    return null;
  }
}

/** True if the user has closed the cookie banner (accepted all or essential). */
export function hasCookieConsent(): boolean {
  return readStoredConsent() !== null;
}

export function CookieConsentBanner() {
  const t = useTranslations("cookieConsent");
  const [consent, setConsent] = useState<CookieConsent>(readStoredConsent);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const acceptAll = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "all");
      setConsent("all");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CLOSED_EVENT));
      }
    } catch {
      // ignore
    }
  };

  const essentialOnly = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "essential");
      setConsent("essential");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CLOSED_EVENT));
      }
    } catch {
      // ignore
    }
  };

  if (!mounted || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[#1A1A1D] bg-[#0B0B0C]/95 backdrop-blur-md p-4 md:p-6 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]"
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-sm text-[#A8A8AA] leading-relaxed">
          {t("message")}{" "}
          <Link
            href="/privacy"
            className="text-[#6E7A8A] hover:text-[#F2F2F2] underline underline-offset-2"
          >
            {t("privacyLink")}
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={essentialOnly}
            className="px-4 py-2.5 text-sm font-medium text-[#A8A8AA] hover:text-[#F2F2F2] border border-[#333] hover:border-[#555] rounded-lg transition-colors"
          >
            {t("essentialOnly")}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="px-4 py-2.5 text-sm font-medium bg-[#F2F2F2] text-[#0B0B0C] hover:bg-white rounded-lg transition-colors"
          >
            {t("acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
