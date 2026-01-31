# Request verification report

Codebase check of all past requests and their implementation status (verified in code).

---

## 1. Composer post search metadata ✅ IMPLEMENTED

**Request:** Show author, publishing date, and quote count in post search results in the mobile composer.

**Verified:**
- `apps/mobile/hooks/useComposerSearch.ts`: `SearchResult` has `createdAt`, `quoteCount`, `replyCount`; mapping includes them (lines 16, 72).
- `apps/mobile/app/post/compose.tsx`: `formatPostSuggestionSubtext` (line 559) shows author, date, quotes/replies; uses `t('compose.quotesCount', ...)` (line 564).
- `apps/mobile/i18n/locales/*.ts`: `compose.quotesCount` present in all 15 locales (en, de, fr, es, it, pt, nl, pl, ru, fi, sv, no, da, cs, hu).

---

## 2. Share profile & User RSS feed options ✅ IMPLEMENTED

**Request:** Options missing or not visible in profile "..." menu.

**Verified:**
- `apps/mobile/components/OptionsActionSheet.tsx`: `ScrollView` with `maxHeight: maxOptionsHeight` (lines 51, 79); options scroll when many.
- Profile options (profile.tsx, user/[handle].tsx) include Share profile and RSS Feed; order and visibility confirmed.

---

## 3. Share profile functionality ✅ IMPLEMENTED

**Request:** Share profile was not working.

**Verified:**
- `apps/mobile/utils/api.ts`: `getWebAppBaseUrl()` (line 34).
- `apps/mobile/app/(tabs)/profile.tsx`: `profileUrl = getWebAppBaseUrl()/user/...` (line 322); `InteractionManager.runAfterInteractions` + `setTimeout(..., 350)` before `Share.share` (lines 327, 331).
- `apps/mobile/app/user/[handle].tsx`: Same pattern (lines 222, 227, 231).

---

## 4. Settings "userHandle" ReferenceError ✅ IMPLEMENTED

**Request:** `ReferenceError: Property 'userHandle' doesn't exist` in settings.

**Verified:**
- `apps/mobile/app/settings/index.tsx`: State `me` from `useState<{ handle?: string } | null>(null)` (line 32); `api.get('/users/me').then(setMe)` (line 40); `me?.handle` used (line 207).

---

## 5. Settings cog & modal icons ✅ IMPLEMENTED

**Request:** Settings needs cog symbol; all modals need icons.

**Verified:**
- `apps/mobile/components/ScreenHeader.tsx`: `titleIcon` prop and `MaterialIcons name={titleIcon}` (lines 27, 42, 66–67).
- `apps/mobile/app/settings/index.tsx`: `titleIcon="settings"` (line 115).
- `apps/mobile/components/OptionsActionSheet.tsx`: `OptionItem` has `icon?: string`; options render icon when present (lines 11–12, 65–72).
- `apps/mobile/components/ConfirmModal.tsx`: `icon` prop and title icon (lines 70, 139).
- Report options use `icon: 'flag'` (user/[handle].tsx, PostItem, reading.tsx).

---

## 6. Profile empty states ✅ IMPLEMENTED

**Request:** Consistent empty states (icon, "No...", i18n) for Posts, Replies, Quotes, Saved, Collections.

**Verified:**
- `apps/mobile/app/(tabs)/profile.tsx`: `EmptyState` with tab-specific `icon` (article, chat-bubble-outline, format-quote, bookmark-outline, folder-open), `headline` (noPosts, noReplies, etc.), `subtext` (noPostsHintView, noRepliesHint, noQuotesHint, noSavedHint, noCollectionsHint / noCollectionsOwnHint) (lines 556–579).
- `apps/mobile/app/user/[handle].tsx`: Same pattern (lines 452–474).
- i18n: `profile.noPostsHintView`, `noRepliesHint`, `noQuotesHint`, `noSavedHint`, `noCollectionsHint`, `noCollectionsOwnHint` in all 15 locales.

---

## 7. Draw background functionality ✅ IMPLEMENTED

**Request:** Drawn background images not storing or showing.

**Verified:**
- `apps/mobile/components/DrawBackgroundModal.tsx`: `ViewShot` + `captureRef` (lines 14, 132); `api.patch('/users/me', { profileHeaderKey: uploadRes.key })` (line 108).
- `apps/mobile/app/(tabs)/profile.tsx`: `profileHeaderImageUrl = (user?.profileHeaderKey ? getImageUrl(user.profileHeaderKey) : null) || user?.profileHeaderUrl` (line 348); `handleDrawSaved` updates `profileHeaderKey` (line 360).

---

## 8. Images not showing (first fix) ✅ IMPLEMENTED

**Request:** No profile/header images in mobile app.

**Verified:**
- `apps/mobile/components/TopicCollectionHeader.tsx`: Uses `getImageUrl(headerImageKey)` (import and usage).
- `apps/mobile/app/post/[id]/reading.tsx`: Hero image uses key-first URL; `getImageUrl(post.headerImageKey)` (line 255).

---

## 9. Comments blank screen ✅ IMPLEMENTED

**Request:** Opening comments on some posts showed blank screen.

**Verified:**
- `apps/mobile/app/post/[id]/comments.tsx`: `normalizeParam(value)` (lines 44–49); `postId = normalizeParam(params.id)` (line 59); when `!postId`, `loadPost` calls `setLoading(false)` (lines 86–88); error UI "Post not found" (line 219).
- `apps/mobile/app/post/[id]/comments/[replyId].tsx`: `normalizeParam` (line 29); `postId`, `parentReplyId` normalized (54–55); "Comment not found" (lines 178, 197).

---

## 10. DM rules – Add Chat ✅ IMPLEMENTED

**Request:** Could message anyone; rules not enforced.

**Verified:**
- `apps/api/src/messages/messages.service.ts`: `findOrCreateThread` checks follow; throws `ForbiddenException` when other user doesn't follow (lines 40, 62, 85).
- `apps/api/src/users/users.controller.ts` / `users.service.ts`: Profile response includes `followsMe` (lines 522–523, 533).
- `apps/mobile/app/user/[handle].tsx`: Message button only when `user.followsMe` (line 390); 403 handled with friendly toast (lines 174–175).

---

## 11. Settings UI / Languages ✅ IMPLEMENTED

**Request:** RSS under Legal; Danger zone in Edit profile; Languages like onboarding (all languages, card grid).

**Verified:**
- `apps/mobile/app/settings/index.tsx`: "My RSS Feed" under Legal section (lines 190–213, `settings.legal` then RSS).
- `apps/mobile/app/settings/profile.tsx`: Danger zone block with delete account (lines 303–319).
- `apps/mobile/constants/languages.ts`: `CONTENT_LANGUAGES` has 29 languages including ar, zh, ja, ko, tr, id, ro, el, he, th, uk, vi (lines 5–32).
- `apps/mobile/app/settings/languages.tsx`: Uses `CONTENT_LANGUAGES`, grid of cards with `lang.name`, `lang.native`, check badge when selected (lines 95–119).

---

## 12. Explore People 500 ✅ IMPLEMENTED

**Request:** Loading explore people caused 500.

**Verified:**
- `apps/api/src/explore/recommendation.service.ts`: Topic-based query only when `userProfile.topics.length > 0` (line 400); otherwise fallback (lines 418–420).
- `apps/api/src/explore/explore.controller.ts`: `getPeople` try/catch; on error returns `exploreService.getPeople(..., { sort: 'cited' })` (lines 34–39).

---

## 13. Blocked accounts ✅ IMPLEMENTED

**Request:** Can't view blocked profiles; list full names; Unblock "Validation failed (uuid expected)".

**Verified:**
- `apps/api/src/safety/safety.service.ts`: `getBlocked` returns `{ id: b.blockedId, displayName, handle }` (lines 216–227).
- `apps/api/src/users/users.controller.ts`: Profile includes `isBlockedByMe` (lines 523–525, 534).
- `apps/mobile/app/user/[handle].tsx`: When `user.isBlockedByMe` shows "You have blocked this account" + Unblock (lines 279, 294–296).
- `apps/mobile/app/settings/blocked.tsx`: Uses `item.id`, `item.displayName`, `item.handle`; unblock calls `api.delete('/safety/block/${targetId}')` with `targetId = unblockTarget?.id` (lines 44–48, 56–70); load error toast `safety.failedLoadBlocked` (line 29).
- i18n: `safety.youBlockedThisAccount`, `blockedAccountHint`, `unknownUser`, `failedLoadBlocked` in locales.

---

## 14. Images still not showing ✅ IMPLEMENTED (follow-up)

**Request:** Still no profile/header images after earlier fixes.

**Verified:**
- `apps/mobile/app.json`: `android.usesCleartextTraffic: true` (line 26).
- `apps/mobile/utils/api.ts`: `getImageUrl(key)` guards empty/falsy and trims base (lines 44–47).
- Profile/user screens prefer key-based URL: e.g. `profileHeaderImageUrl = (user?.profileHeaderKey ? getImageUrl(...) : null) || user?.profileHeaderUrl` (profile.tsx line 348).
- `apps/mobile/app/(tabs)/profile.tsx`: Uses `expo-image` for header and avatar with `contentFit`, `cachePolicy="memory-disk"`.
- `apps/mobile/app/user/[handle].tsx`: Uses `expo-image` for avatar.
- `apps/mobile/app/post/[id]/reading.tsx`: Hero image key-first URL and `cachePolicy="memory-disk"`.

---

## Summary

| # | Request                         | Status   |
|---|----------------------------------|----------|
| 1 | Composer search metadata         | Verified |
| 2 | Share/RSS options visible        | Verified |
| 3 | Share profile working            | Verified |
| 4 | Settings userHandle → me         | Verified |
| 5 | Settings cog + modal icons       | Verified |
| 6 | Profile empty states             | Verified |
| 7 | Draw background store/show       | Verified |
| 8 | Images (first fix)               | Verified |
| 9 | Comments blank screen            | Verified |
| 10| DM rules (followsMe)             | Verified |
| 11| Settings UI / Languages         | Verified |
| 12| Explore People 500              | Verified |
| 13| Blocked accounts                | Verified |
| 14| Images (cleartext + key-first)  | Verified |

All 14 requests are implemented and present in the codebase as of this verification.
