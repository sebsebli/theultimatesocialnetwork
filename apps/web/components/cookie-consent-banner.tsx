"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="bg-[#0B0B0C] border border-[#1A1A1D] rounded-xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
        <h2 className="text-xl font-bold text-[#F2F2F2]">
          We value your privacy
        </h2>
        <p className="text-sm text-[#A8A8AA] leading-relaxed">
          We use cookies to enhance your experience, analyze site traffic, and
          serve personalized content. By clicking &quot;Accept All&quot;, you
          consent to our use of cookies. Read our{" "}
          <Link
            href="/privacy"
            className="text-[#6E7A8A] hover:text-[#F2F2F2] underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={acceptAll}
            className="flex-1 px-4 py-3 text-sm font-bold bg-[#F2F2F2] text-[#0B0B0C] hover:bg-white rounded-lg transition-colors"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={essentialOnly}
            className="flex-1 px-4 py-3 text-sm font-medium text-[#A8A8AA] hover:text-[#F2F2F2] border border-[#333] hover:border-[#555] rounded-lg transition-colors"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}
