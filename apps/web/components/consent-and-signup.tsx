"use client";

import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { SignupOverlay } from "@/components/signup-overlay";

/**
 * Renders cookie consent banner (when required) and signup overlay for unauthenticated visitors on public content pages.
 * Both are client-only and respect user choices (localStorage / sessionStorage).
 */
export function ConsentAndSignup() {
  return (
    <>
      <CookieConsentBanner />
      <SignupOverlay />
    </>
  );
}
