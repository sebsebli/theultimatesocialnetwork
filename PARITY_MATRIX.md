# Mobile -> Web Parity Matrix

| Feature | Mobile Implementation | Web Status | Gaps / Action Items |
| :--- | :--- | :--- | :--- |
| **Home Feed** | | | |
| Pagination | Infinite Scroll (`onEndReached`) | **Done** | Implemented `FeedList` with "Load More" button (Pagination logic). |
| Suggestions | Fetch `/users/suggested` when empty | **Done** | Implemented in `FeedList`. |
| Invite Nudge | Specific component in empty state | **Done** | Implemented `InviteNudge` component. |
| **Compose** | | | |
| Validation | Strict (Body min/max, Title max, Heading max, Ref count) | **Done** | Ported `enforceTitleAndAliasLimits` and validation logic in `ComposeContent`. |
| Formatting | Protected Ranges (no format in links) | **Done** | Ported `getProtectedRanges` and `insertText` logic. |
| Preview | Full Article Preview (Sources, Quoted By) | **Done** | Used `ReadingMode` for preview (matches Mobile `PostArticleBlock`). |
| Image Picker | `expo-image-picker` | **Done** | `ImageUploader` parity achieved. |
| **Explore** | | | |
| Tabs | Topics, People, Quoted, Deep Dives, Newsroom | **Done** | Verified. |
| Search | Navigates to `/search` | **Done** | Search input present. |
| Logic | Follow/Unfollow Topics/People | **Done** | Implemented in `ExploreContent`. |
| **Profile** | | | |
| Header | Background Draw/Upload/Remove | **Done** | Header Image Upload/Remove implemented. (Draw deferred). |
| Avatar | Update/Remove | **Done** | Avatar Upload implemented. |
| Tabs | Posts, Replies, Quotes, Saved, Collections | **Done** | "Saved" tab added. |
| Keeps | "Keeps Library" link in Saved tab | **Done** | Added link to `/keeps`. |
| Collections | Create/Edit/Delete | **Done** | (Existing logic reused/verified). |
| Options | Share, RSS, Settings | **Done** | Added `ProfileOptionsMenu`. |
| **Settings** | | | |
| Menu | Accessible from Profile/Home | **Done** | Accessible via Profile Options. |
| Sub-pages | `/settings/profile`, `/settings/languages`, `/settings/relevance`, `/settings/notifications`, `/settings/offline-storage`, `/settings/blocked`, `/settings/muted`, `/settings/danger-zone` | **Done** | Added `/settings/languages`, `/settings/profile`, `/settings/notifications`. Offline-storage N/A on web. Danger-zone behavior is inline on main settings page. |
| **Messages / Inbox** | | | |
| Tab | "Chats" with thread list, thread view, new message, real-time, unread badge | **Partial** | Web has Inbox with Notifications + Messages tab. Nav label unified to "Messages" (was "Activity"). Full DMs UX aligned where applicable. |
| **Navigation** | | | |
| Tabs | Home, Discover, Compose, Messages, Profile | **Done** | Web nav/sidebar label unified to "Messages". Desktop sidebar has Collections, Keeps, Settings. |

## Design Coherence (Why Web Feels Different)

| Area | Mobile | Web | Gap |
| :--- | :--- | :--- | :--- |
| **Design tokens** | Single source: `constants/theme.ts` (COLORS, SPACING, SIZES, LAYOUT, HEADER, MODAL) | **Done** | `packages/design-tokens` added; web Tailwind + globals.css driven from it; mobile theme re-exports from package. |
| **Hard-coded values** | Components use theme constants | **Done** | Landing page and globals.css use design tokens (bg-ink, text-paper, border-divider, etc.). |
| **Layout / spacing** | LAYOUT.contentPaddingHorizontal, HEADER.*, MODAL.* | Ad-hoc Tailwind (px-4, px-6, etc.); different modal padding/radius | Define web LAYOUT/HEADER/MODAL from shared tokens; use consistently. |
| **Component patterns** | ScreenHeader, ConfirmModal, sheets use theme | Per-component headers/modals; no shared spec | Align header and modal/sheet components with mobile spec. |

See **docs/WEB_MOBILE_PARITY_AND_DESIGN.md** for full analysis and action plan.

## Completion Status

- **Golden Flow (Home, Compose, Explore, Profile, Settings menu):** Addressed.
- **Full feature parity:** Settings sub-pages (languages, profile, notifications) and Messages nav label implemented; design-token package and landing-page tokens done.