# Frontend production readiness (Web & Mobile)

Summary of what’s in place and what’s recommended for a high-performance, production-ready social network.

---

## Already in place

### Error handling
- **Web:** Root `ErrorBoundary`, route-level `error.tsx`, `global-error.tsx` (full app fallback). All show “Something went wrong” + Try again / Home.
- **Mobile:** Root `ErrorBoundary` with `ErrorFallbackWithNav`; `ErrorState` for inline errors. Comment in ErrorBoundary for Sentry hook.

### Loading & skeletons
- **Web:** `loading.tsx` for home, explore, post, search, user; skeletons (PostSkeleton, ProfileSkeleton, ExploreSkeleton).
- **Mobile:** FLATLIST_DEFAULTS, ListFooterLoader, SectionHeader; PostSkeleton, ProfileSkeleton; EmptyState everywhere for list empty states.

### Performance
- **Web:** Memoized list/card components (PostItem, UserCard, TopicCard, FeedList, etc.); Next.js Image with sizes; image proxy with cache; Blurhash placeholders on post headers.
- **Mobile:** Memoized list items and presentational components; expo-image with cachePolicy and placeholders; FLATLIST_DEFAULTS (windowSize, initialNumToRender, etc.).

### Accessibility (web)
- Skip link, main landmark, aria-labels on icon controls, 44px touch targets, focus-visible, reduced motion, safe area. See `docs/WEB_UX_AUDIT.md`.

### Security & headers (web)
- HSTS, X-Frame-Options, CSP, Permissions-Policy, Referrer-Policy. Deep links: apple-app-site-association, assetlinks.json.

### PWA & metadata
- Web: `manifest.json`, favicons, apple-touch-icon, metadata in layout.

### Offline (mobile)
- OfflineBanner, offline queue (useOfflineSync), saved posts for offline reading.

---

## Recommended next steps (prioritized)

### 1. Error reporting (high)
- **Web:** Plug Sentry (or similar) into `ErrorBoundary.componentDidCatch` and `error.tsx` / `global-error.tsx` (e.g. `captureException`). Use `NEXT_PUBLIC_SENTRY_DSN` or env-based enable.
- **Mobile:** Uncomment / implement Sentry in `ErrorBoundary.componentDidCatch` (Expo: `expo-error-reporting` or `@sentry/react-native`). Ensures production errors are visible and debuggable.

### 2. Route-level code splitting (web, high)
- Use `next/dynamic` with `loading` for heavy client components (e.g. ExploreContent, TopicPage, ComposeContent, PostDetail). Reduces initial JS and improves TTI/LCP for users who don’t hit those routes first.
- Keep server components as-is; only wrap large client trees that are not on the critical path.

### 3. API client resilience (medium)
- **Web:** Add a small fetch wrapper or use a library (e.g. retry with backoff) for feed/explore/search so transient 5xx/network errors auto-retry once or twice before showing error state.
- **Mobile:** Already has offline queue; consider retry with backoff for critical GETs (e.g. feed on mount) so bad network doesn’t immediately show error.

### 4. Analytics & monitoring (medium)
- Optional: privacy-respecting analytics (e.g. Plausible, Fathom) or first-party events for key actions (sign-up, post, share). No PII in URLs or client IDs if required by policy.
- Optional: RUM (e.g. Web Vitals reporting to your backend or Sentry) for LCP, FID, CLS.

### 5. Performance audit (medium)
- **Web:** Run Lighthouse (performance, accessibility) on home, post, explore; fix any “Avoid large layout shifts” (e.g. reserve space for images) and “Reduce unused JavaScript” (code splitting above).
- **Mobile:** Profile long lists (e.g. feed with 100+ items); ensure no unnecessary re-renders (you already memoized; verify with React DevTools or Flipper).

### 6. E2E & critical-path tests (medium)
- Add a few Playwright (web) and Detox or Maestro (mobile) tests for: sign-in → feed load, open post, compose (or at least “load feed” and “open post”). Catches regressions before deploy.

### 7. PWA installability & offline (low)
- Web: If you want “Add to Home Screen” and basic offline shell, add a service worker (e.g. next-pwa or workbox) and ensure `manifest.json` has short_name, start_url, display. Already have manifest reference in layout.

### 8. Content security (low)
- Web: Tighten CSP over time (e.g. remove `'unsafe-inline'` for scripts by using nonces or hashes if you inject little or no inline script). Optional: Subresource Integrity for third-party scripts if any.

---

## Quick reference

| Area              | Web | Mobile |
|-------------------|-----|--------|
| Error boundaries  | ✅  | ✅     |
| Loading/skeletons | ✅  | ✅     |
| List performance | ✅  | ✅     |
| Memoization       | ✅  | ✅     |
| Empty states      | ✅  | ✅     |
| Accessibility     | ✅  | —      |
| Security headers  | ✅  | —      |
| Image optimization| ✅  | ✅     |
| Error reporting   | ❌  | ❌     |
| Code splitting    | Partial (loading.tsx) | — |
| Retry/backoff     | ❌  | Partial (offline queue) |
| E2E tests         | ❌  | ❌     |

Implementing **error reporting** and **route-level code splitting (web)** gives the biggest gain for production readiness with limited effort.
