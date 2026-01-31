# Web vs Mobile: Feature Parity & Design Coherence

This doc explains **why** the web app hasn’t implemented all mobile features, **why** designs feel different despite shared colors, and **what to do** for coherent features and design.

---

## 1. Why hasn’t web implemented all features from mobile?

### 1.1 Parity was scoped to “Golden Flow” only

`PARITY_MATRIX.md` was written around a **Golden Flow**: Home Feed, Compose, Explore, Profile, and Settings **menu access**. That scope was completed, so the matrix says “all major parity gaps addressed.” It was never intended to cover **every** mobile screen and sub-feature.

### 1.2 Feature gaps (web missing or different)

| Area | Mobile | Web | Gap |
|------|--------|-----|-----|
| **Messages** | Full DMs: thread list, thread view, new message, real-time, unread badge | Inbox = Notifications + “Activity” tab; messages UI/API may differ | Web doesn’t mirror mobile’s Messages tab and flows. |
| **Settings sub-pages** | Dedicated routes: `profile`, `languages`, `relevance`, `notifications`, `offline-storage`, `blocked`, `muted`, `danger-zone` | Single settings page + `blocked`, `muted`, `relevance` only | Web has **no** `/settings/languages` (link points to non-existent route), no dedicated **edit profile**, **notifications**, **offline-storage** (N/A on web), or **danger-zone** (delete is inline). |
| **Edit profile** | `/settings/profile` (display name, bio, etc.) | Not a dedicated settings sub-page | Edit profile flow is missing or lives elsewhere. |
| **Notifications settings** | `/settings/notifications` (push, in-app prefs) | Toggles on main settings page only | No dedicated notifications screen. |
| **Offline storage** | Toggle + “Saved for offline” count, clear | N/A on web | Not applicable; no parity needed. |
| **Danger zone** | Dedicated `/settings/danger-zone` (export, delete) | Export/delete on main settings page | Same behavior, different structure. |
| **Navigation** | Tabs: Home, Discover, Compose, **Messages**, Profile | Sidebar + bottom nav: Home, Discover, Compose, **Activity** (inbox), Profile | “Activity” vs “Messages”; desktop has Collections/Keeps in sidebar, mobile from profile. |
| **Onboarding** | Full flow: languages → profile → starter-packs | Same routes under `/onboarding` | Present; ensure redirects and entry points match mobile. |

So: **web is missing** (or different in structure):

- Full Messages experience aligned with mobile.
- Settings sub-routes: **languages** (and fix broken link), **edit profile**, **notifications** (optional dedicated page).
- Consistent naming (e.g. “Messages”/“Chats” vs “Activity”) and nav structure where it makes sense.

---

## 2. Why do web designs feel different (even though both are mobile + desktop friendly)?

The two apps use **the same idea** (ink/paper/primary, Inter, etc.) but **no single source of truth** and different layout/component patterns. So they drift.

### 2.1 No single source of truth for design tokens

- **Mobile:** `apps/mobile/constants/theme.ts` — one place for `COLORS`, `SPACING`, `SIZES`, `LAYOUT`, `HEADER`, `MODAL`.
- **Web:** Tokens live in **two** places:
  - `apps/web/app/globals.css` — `:root` and utility classes (e.g. `bg-ink`, `text-paper`).
  - `apps/web/tailwind.config.js` — `theme.extend` (colors, spacing, etc.).

Result: **Duplication and drift.** Example: mobile `error: '#B85C5C'`, web `error: '#EF4444'` in Tailwind — different reds.

### 2.2 Hard-coded values instead of tokens

Many web components use **raw hex** instead of design tokens, especially on the landing page (e.g. `#0B0B0C`, `#F2F2F2`, `#6E6E73`). So even when tokens exist, they’re not used consistently, and the app doesn’t feel like the same design system as mobile.

### 2.3 Different layout and spacing systems

- **Mobile:** `LAYOUT.contentPaddingHorizontal`, `HEADER.barPaddingBottom`, `MODAL.*` — consistent padding and header/sheet behavior.
- **Web:** Ad-hoc Tailwind (`px-4`, `px-6`, `py-3`, etc.) and different modal/sheet padding and radii. No shared “layout constants” that match mobile.

So **spacing and density** feel different even when colors match.

### 2.4 Different component patterns

- **Mobile:** Shared primitives (e.g. `ScreenHeader`, `ConfirmModal`, bottom sheets) all use `theme.ts` (HEADER, MODAL).
- **Web:** Headers and modals are built per-page or per-component with Tailwind; no shared header/modal spec aligned with mobile’s LAYOUT/HEADER/MODAL.

### 2.5 Navigation and information architecture

- **Mobile:** Bottom tabs (Home, Discover, Compose, Messages, Profile).
- **Web:** Desktop = sidebar (with extra items like Collections, Keeps, Settings); mobile = bottom bar with “Activity” instead of “Messages.” Same content, different IA and labels.

So “different designs” come from: **token drift, hard-coded values, different spacing/layout rules, different component patterns, and different nav/IA.**

---

## 3. What to do: coherent features and design

### 3.1 Feature coherence

1. **Fix settings**
   - Add `/settings/languages` (or point the existing link to a real route, e.g. under authenticated layout).
   - Add `/settings/profile` for edit profile (or clearly document that edit profile lives only in onboarding / profile page).
   - Optionally add `/settings/notifications` for parity with mobile; otherwise document that web keeps notification toggles on the main settings page.

2. **Messages vs Activity**
   - Decide one name and use it everywhere (e.g. “Messages” / “Chats” on both).
   - Align web inbox with mobile: same tabs (Notifications / Messages), same message list and thread UX where possible.

3. **Keep PARITY_MATRIX.md as the single checklist**
   - Extend it with **all** features above (Settings sub-pages, Messages, Edit profile, etc.).
   - Mark each as Done / Partial / Missing so web progress is clear.

### 3.2 Design coherence

1. **Single source of truth for tokens**
   - Introduce a **shared** token file (e.g. `packages/design-tokens/` or `apps/web/lib/theme.ts`) that defines colors, spacing, and key layout numbers.
   - Mobile: keep using it (or re-export from there).
   - Web: generate Tailwind theme and CSS variables from that file so both apps use the same values (including error red, radii, spacing).

2. **Use tokens everywhere on web**
   - Replace raw hex and arbitrary values in `landing-page.tsx` and elsewhere with Tailwind classes or CSS variables that come from the shared tokens (e.g. `bg-ink`, `text-paper`, `border-divider`).

3. **Align layout and components**
   - Define web equivalents of `LAYOUT`, `HEADER`, `MODAL` (e.g. in Tailwind or a layout component) so padding, header height, and modal/sheet style match mobile.
   - Use shared header and modal/sheet components (or at least shared specs) so both platforms feel like one product.

4. **Unify naming and nav**
   - Use the same labels (e.g. “Messages”) and similar nav structure (tabs vs sidebar) where it makes sense, so users don’t feel like two different products.

---

## Summary

- **Features:** Web hasn’t implemented “all” mobile features because parity was defined as Golden Flow only. Gaps: Settings sub-pages (languages, edit profile, notifications), full Messages parity, and consistent nav naming.
- **Design:** Designs differ because tokens are duplicated and can drift, many web UIs use hard-coded values, and layout/component patterns and nav/IA are not aligned with mobile.
- **Path to coherence:** Extend the parity matrix with every missing feature, fix settings and Messages, then introduce a single design-token source and use it on web (and mobile) everywhere, and align layout and component patterns so both apps feel like one system.
