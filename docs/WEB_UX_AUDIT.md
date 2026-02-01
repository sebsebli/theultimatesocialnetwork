# Web app UI/UX audit and fixes

Summary of the full UI/UX audit and changes applied for production readiness and user satisfaction.

## Accessibility

- **Skip link** — “Skip to main content” added in root layout; visible on keyboard focus only. Targets `#main-content` on all main content areas (landing, authenticated layout, 404, error).
- **Landmarks** — `<main id="main-content" role="main">` on landing, authenticated layout, not-found, and error pages. Nav has `aria-label="Main"` (landing) and `aria-label="Primary"` (bottom nav).
- **Labels** — Email on sign-in has a visible `<label>`. All icon-only controls have `aria-label` (nav items, home header search/settings, explore filters/sort, post actions like Like/Reply/Quote/Keep/Share/Add to collection, toast dismiss).
- **Active nav** — `aria-current="page"` on the active item in bottom nav (Home, Discover, Chats, Profile).
- **Focus** — Global `:focus-visible` styles in `globals.css` for links, buttons, inputs. Primary actions use `focus-visible:ring-2 focus-visible:ring-primary` where needed.
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` in globals disables decorative animations (fade-in, slide-in, pulse, float) and smooth scroll.
- **Cookie consent** — Banner has `aria-live="polite"` and `role="dialog"`.
- **Loading** — Authenticated layout loading state uses `role="status"` and `aria-live="polite"` with a spinner and “Loading…” text.

## Touch targets and responsiveness

- **44px minimum** — Nav items use `min-h-[44px]`. Home header search/settings, post action buttons, toast dismiss, not-found/error primary buttons, sign-in buttons, feed “Load more” use at least 44px height or padding.
- **Safe area** — `.safe-area-pb` in globals adds `padding-bottom: env(safe-area-inset-bottom)` for bottom nav on notched devices.
- **Toast on mobile** — Toasts sit above the bottom nav (`bottom-20` on small screens, full-width with side padding).

## Error and loading states

- **Feed “Load more”** — On failure, shows inline “Something went wrong. Try again below.” and a toast; button has `aria-busy` and `aria-label` when loading.
- **Authenticated layout** — Replaced plain “Loading…” with a spinner and short message for consistency with home loading skeletons.

## Consistency and polish

- **Desktop sidebar** — Home icon fill uses `isActive("/home")` instead of `isActive("/")` so the active state is correct.
- **Sign-in** — Email field has a visible label and placeholder “you@example.com”; primary and secondary buttons have focus rings and min height.
- **404 / error / global-error** — Primary actions have min height, focus-visible rings, and (where applicable) `id="main-content"` and `role="main"` for skip target.

## Files changed

- `app/globals.css` — Focus-visible, skip link, safe-area-pb, sr-only, reduced-motion.
- `app/layout.tsx` — Skip link.
- `app/(authenticated)/layout.tsx` — Main `id`/role, loading spinner and status.
- `app/sign-in/page.tsx` — Email label, button focus and min height.
- `app/not-found.tsx` — Main id/role, button touch target and focus.
- `app/error.tsx` — Main id/role, button touch targets and focus.
- `app/global-error.tsx` — Button min height.
- `app/(authenticated)/home/page.tsx` — Search/settings aria-labels and touch targets.
- `app/(authenticated)/explore/page.tsx` — Filters/Sort aria-labels and touch targets.
- `components/landing-page.tsx` — Main id/role, nav aria-label.
- `components/navigation.tsx` — Aria-labels and aria-current on all items, min height, nav aria-label.
- `components/desktop-sidebar.tsx` — Home icon active state fix.
- `components/feed-list.tsx` — Load-more error toast and inline message, button aria and focus.
- `components/post-item.tsx` — Aria-labels and min touch targets on all action buttons.
- `components/ui/toast.tsx` — Dismiss button aria-label, toast position above mobile nav, region aria-label.
- `components/cookie-consent-banner.tsx` — aria-live="polite".

## Checklist (post-audit)

- [x] Skip to main content link
- [x] Main landmark and id on all main content
- [x] All icon-only controls have aria-label
- [x] All primary buttons/links have visible focus and min 44px touch target where applicable
- [x] Sign-in email has visible label
- [x] Feed load-more error handling and feedback
- [x] Reduced motion respected
- [x] Safe area for bottom nav
- [x] Toast above mobile nav and dismissible with label
