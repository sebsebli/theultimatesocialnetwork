# Web vs Mobile — Feature-by-Feature Audit

**Date:** 2026-02-01  
**Scope:** Every user-facing feature. ✅ = present and aligned, ⚠️ = gap or difference, ❌ = missing or broken.

---

## Authentication

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Email → send code | ✅ | ✅ `/sign-in` | ✅ |
| Enter code → verify | ✅ | ✅ `/verify` | ✅ |
| Beta mode / invite required | ✅ | ✅ `/api/invites/beta-mode`, invite field when on | ✅ |
| Terms checkbox when invite required | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ `/api/auth/logout` | ✅ |
| Session persistence | ✅ SecureStore/token | ✅ HttpOnly cookie + /api/auth/verify | ✅ |

---

## Onboarding

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Redirect if needsOnboarding | ✅ | ✅ layout + sign-in redirect | ✅ |
| Step: Languages | ✅ `/onboarding/languages` | ✅ `/onboarding/languages` | ✅ |
| Step: Profile (handle, displayName, bio, avatar) | ✅ `/onboarding/profile` | ✅ `/onboarding/profile` | ✅ |
| Step: Starter packs | ✅ `/onboarding/starter-packs` | ✅ `/onboarding/starter-packs` | ✅ |
| Order: languages → profile → starter-packs | ✅ | ✅ sessionStorage stage | ✅ |
| Finish → Home | ✅ | ✅ | ✅ |

---

## Home / Feed

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Load feed | ✅ GET /feed | ✅ GET /api/feed | ✅ |
| Post items (author, body, title, header image) | ✅ | ✅ PostItem + Avatar | ✅ |
| Like post | ✅ POST/DELETE /posts/:id/like | ✅ /api/posts/:id/like | ✅ |
| Reply (link to post#reply) | ✅ | ✅ | ✅ |
| Quote (link to compose?quote=) | ✅ | ✅ | ✅ |
| Keep post | ✅ POST/DELETE /posts/:id/keep | ✅ /api/posts/:id/keep | ✅ |
| Add to collection | ✅ Sheet | ✅ AddToCollectionModal | ✅ |
| Share post | ✅ Share sheet | ✅ Copy + Web Share API | ✅ |
| Overflow: Report / Delete / Copy link | ✅ | ✅ OverflowMenu | ✅ |
| Saved-by items in feed | ✅ | ✅ SavedByItem | ✅ |
| Empty state → suggested users | ✅ | ✅ /api/users/suggested, UserCard | ✅ |
| Load more / infinite scroll | ✅ | ✅ | ✅ |
| Private like count (author only) | ✅ | ✅ | ✅ |

---

## Explore / Discover

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Tabs: Quoted Now, Deep Dives, Newsroom, Topics, People | ✅ | ✅ Same order & labels | ✅ |
| Default tab: Quoted Now | ✅ | ✅ | ✅ |
| API: /explore/quoted-now, deep-dives, newsroom, topics, people | ✅ | ✅ /api/explore/* | ✅ |
| Search bar → open search page | ✅ Tap → /search | ✅ Link → /search | ✅ Fixed |
| Topic cards (title, posts, followers, Follow) | ✅ + optional image | ✅ recentPostImageKey from API; TopicCard shows image | ✅ |
| People cards (avatar, name, handle, bio, Follow) | ✅ | ✅ UserCard + Avatar | ✅ |
| Post list with WhyLabel | ✅ | ✅ | ✅ |
| Sort (recommended, etc.) | ✅ | ✅ Sort Options UI | ✅ |

---

## Search

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Search page | ✅ /search | ✅ /search | ✅ |
| Search “all” (posts + users + topics) | ✅ GET /search/all | ✅ GET /api/search/all | ✅ Fixed (route added) |
| Search posts | ✅ GET /search/posts | ✅ GET /api/search/posts | ✅ Fixed (route added) |
| Search people | ✅ GET /search/users | ✅ GET /api/search/users | ✅ |
| Search topics | ✅ GET /search/topics (Meilisearch) | ✅ GET /api/search/topics (filter explore/topics) | ⚠️ Web filters; mobile uses Meilisearch |
| Tabs: All, Posts, People, Topics | ✅ | ✅ | ✅ |
| topicSlug filter for posts | ✅ | ✅ | ✅ |
| Debounced input | ✅ | ✅ | ✅ |
| Result: PostItem, UserCard, TopicCard | ✅ | ✅ | ✅ |

---

## Compose

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| New post | ✅ /post/compose | ✅ /compose | ✅ |
| Quote post | ✅ compose?quote= or prefill | ✅ /compose?quote= | ✅ |
| Title, body, header image | ✅ | ✅ ComposeEditor | ✅ |
| Wikilinks / topics | ✅ | ✅ | ✅ |
| Publish | ✅ POST /posts | ✅ POST /api/posts | ✅ |
| Upload header image | ✅ | ✅ /api/upload/header-image | ✅ |

---

## Post Detail

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Single post by ID | ✅ /post/[id] | ✅ /post/[id] | ✅ |
| Author (avatar, name, handle, time) | ✅ | ✅ Avatar + meta | ✅ |
| Body, title, header image | ✅ | ✅ | ✅ |
| Reading mode | ✅ /post/[id]/reading | ✅ /post/[id]/reading | ✅ |
| Like, Keep, Reply, Quote, Share, Overflow | ✅ | ✅ | ✅ |
| Sources section | ✅ | ✅ SourcesSection | ✅ |
| Referenced-by section | ✅ | ✅ ReferencedBySection + Avatar | ✅ |
| Replies list | ✅ Threaded (comments, replyId) | ✅ Threaded (ReplySection: childrenByParent, loadChildren, expand) | ✅ |
| Add reply | ✅ | ✅ ReplySection POST | ✅ |
| Mark reply read / link to reply | ✅ | ✅ Link to post#reply | ✅ |

---

## Profile (self & other)

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| View profile by handle | ✅ /user/[handle] | ✅ /user/[handle] | ✅ |
| Header image (cover) | ✅ | ✅ | ✅ |
| Avatar (image or initial) | ✅ | ✅ Avatar | ✅ |
| Edit avatar/header (self) | ✅ | ✅ ImageUploader | ✅ |
| displayName, handle, bio | ✅ | ✅ | ✅ |
| Follow / Unfollow | ✅ | ✅ /api/users/:id/follow | ✅ |
| Message (start thread) | ✅ | ✅ POST /api/messages/threads, redirect /inbox?thread= | ✅ |
| Stats: Followers, Following, Quotes received | ✅ | ✅ | ✅ |
| Tabs: Posts, Replies, Quotes, Saved, Collections | ✅ | ✅ | ✅ |
| Load tab data (replies, quotes, collections) | ✅ | ✅ /api/users/:id/replies, quotes, collections | ✅ |
| Profile options menu (block, report, etc.) | ✅ | ✅ ProfileOptionsMenu | ✅ |
| Edit profile (settings) | ✅ /settings/edit-profile | ✅ /settings/profile (displayName, handle, bio, isProtected) | ✅ |

---

## User Connections

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Followers list | ✅ /user/[handle]/connections?tab=followers | ✅ /user/[handle]/connections?tab=followers | ✅ |
| Following list | ✅ ?tab=following | ✅ ?tab=following | ✅ |
| API: /users/:id/followers, following | ✅ | ✅ /api/users/:id/followers, following | ✅ |

---

## Messages / Inbox

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Inbox entry | ✅ Chats tab | ✅ /inbox (nav “Chats”) | ✅ |
| Notifications + Messages tabs | ✅ Separate screens (notifications.tsx, messages) | ✅ Single /inbox with tabs | ✅ |
| List threads | ✅ GET /messages/threads | ✅ GET /api/messages/threads | ✅ |
| Thread: otherUser avatar, name, last message, unread | ✅ | ✅ Avatar + lastMessage + unreadCount | ✅ |
| Open thread, load messages | ✅ GET /messages/threads/:id/messages | ✅ GET /api/messages/threads/:id/messages | ✅ |
| Send message | ✅ POST /messages/threads/:id/messages | ✅ POST same | ✅ |
| Realtime new message | ✅ Socket | ✅ useRealtime | ✅ |
| Start chat from profile | ✅ Message button → thread | ✅ Message button → POST threads → /inbox?thread= | ✅ |
| **New message from inbox** (pick user, create thread) | ✅ /messages/new (suggested + user search) | ✅ MessagesTab: New message + user search, POST threads | ✅ |
| Search chats (mobile) | ✅ GET /messages/search | ✅ GET /api/messages/search; chat search in MessagesTab | ✅ |

---

## Notifications

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| List notifications | ✅ GET /notifications | ✅ GET /api/notifications | ✅ |
| Mark one read | ✅ | ✅ /api/notifications/:id/read | ✅ |
| Mark all read | ✅ | ✅ /api/notifications/read-all | ✅ |
| Types: FOLLOW, REPLY, QUOTE, LIKE, MENTION | ✅ | ✅ formatNotificationText | ✅ |
| Link to actor or post | ✅ | ✅ getNotificationLink | ✅ |
| Unread indicator | ✅ | ✅ dot when !readAt | ✅ |

---

## Collections

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| List collections | ✅ /collections | ✅ /collections | ✅ |
| Create collection | ✅ | ✅ CreateCollectionModal | ✅ |
| Collection detail | ✅ /collections/[id] | ✅ /collections/[id] | ✅ |
| Add/remove post in collection | ✅ | ✅ /api/collections/[id]/items | ✅ |
| Edit collection | ✅ | ✅ EditCollectionModal | ✅ |

---

## Keeps

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| List kept posts | ✅ /keeps | ✅ /keeps | ✅ |
| Search/filter keeps | ✅ | ✅ search + filter (all/unsorted/in-collections) | ✅ |
| Add to collection from keeps | ✅ | ✅ AddToCollectionModal | ✅ |
| API: GET /keeps | ✅ | ✅ /api/keeps | ✅ |

---

## Topic Page

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Topic by slug | ✅ /topic/[slug] | ✅ /topic/[slug] | ✅ |
| Header, follow, post list | ✅ | ✅ TopicPage | ✅ |
| Top authors (placeholder) | ✅ | ✅ “Coming soon” | ✅ |

---

## Settings

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Account: Edit profile | ✅ /settings/profile | ✅ /settings/profile | ✅ |
| Account: Invite Friends | ✅ /invites | ✅ /invites | ✅ |
| Account: Languages | ✅ /settings/languages | ✅ /settings/languages | ✅ |
| Content: Relevance | ✅ /settings/relevance | ✅ /settings/relevance | ✅ |
| Content: Notifications | ✅ /settings/notifications | ✅ /settings/notifications | ✅ |
| Offline reading (toggle + manage) | ✅ /settings/offline-storage | N/A (native) | ✅ OK |
| Safety: Blocked | ✅ /settings/blocked | ✅ /settings/blocked | ✅ |
| Safety: Muted | ✅ /settings/muted | ✅ /settings/muted | ✅ |
| Legal: Terms, Privacy, Imprint | ✅ | ✅ Links | ✅ |
| Legal: My RSS Feed | ✅ | ✅ | ✅ |
| Legal: Request my data | ✅ | ✅ /api/me/request-export | ✅ |
| Legal: Danger zone | ✅ /settings/danger-zone | ✅ /settings/danger-zone | ✅ |
| Sign out | ✅ | ✅ | ✅ |
| Section order | Account → Content → Offline → Safety → Legal → Sign out | Account, Privacy, Content, Email, Feed, Explore relevance, Safety, Legal, Sign out | ⚠️ Different order & extra sections |

---

## Invites & Waiting List

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Join waiting list | ✅ /waiting-list | ✅ /waiting-list | ✅ |
| Invites page (my invites, generate) | ✅ /invites | ✅ /invites | ✅ |
| Invite link /invite/[handle] | ✅ | ✅ | ✅ |

---

## Public & Legal Pages

| Feature | Mobile | Web | Status |
|--------|--------|-----|--------|
| Landing | ✅ | ✅ / | ✅ |
| Welcome (unauthenticated) | ✅ /welcome | ✅ (landing + sign-in) | ✅ |
| Manifesto | ✅ | ✅ /manifesto | ✅ |
| Roadmap | ✅ | ✅ /roadmap | ✅ |
| Terms | ✅ Link | ✅ /terms | ✅ |
| Privacy | ✅ Link | ✅ /privacy | ✅ |
| Imprint | ✅ Link | ✅ /imprint | ✅ |
| AI Transparency | ✅ | ✅ /ai-transparency | ✅ |
| Verify (email code) | ✅ /verify | ✅ /verify | ✅ |

---

## API Proxies (Web BFF)

| Feature | Mobile (direct API) | Web (Next.js API routes) | Status |
|--------|----------------------|---------------------------|--------|
| Auth: login, verify, logout | ✅ | ✅ /api/auth/* | ✅ |
| Feed | ✅ | ✅ /api/feed | ✅ |
| Explore: topics, people, quoted-now, deep-dives, newsroom | ✅ | ✅ /api/explore/* | ✅ |
| Search: all, posts, users, topics | ✅ | ✅ /api/search/all, posts, users, topics | ✅ Fixed (all + posts added) |
| Posts: CRUD, like, keep, replies, referenced-by, sources | ✅ | ✅ /api/posts/* | ✅ |
| Users: me, suggested, follow, followers, following, replies, quotes, collections | ✅ | ✅ /api/users/*, /api/me | ✅ |
| Messages: threads, create thread, messages | ✅ | ✅ /api/messages/threads* | ✅ |
| Notifications | ✅ | ✅ /api/notifications* | ✅ |
| Collections | ✅ | ✅ /api/collections* | ✅ |
| Keeps | ✅ | ✅ /api/keeps | ✅ |
| Safety: block, mute, report, blocked, muted | ✅ | ✅ /api/safety/* | ✅ |
| Topics: follow | ✅ | ✅ /api/topics/[slug]/follow | ✅ |
| Upload: header image | ✅ | ✅ /api/upload/header-image | ✅ |
| Me: notification-prefs, request-export, delete, etc. | ✅ | ✅ /api/me/* | ✅ |
| Invites: beta-mode | ✅ | ✅ /api/invites/beta-mode | ✅ |
| Waiting list | ✅ | ✅ /api/waiting-list | ✅ |
| Messages search | ✅ GET /messages/search | ✅ GET /api/messages/search | ✅ |

---

## Summary of Gaps (current)

**Addressed (fixed):**
- Search: `/api/search/all` and `/api/search/posts` added; Explore search bar links to `/search`.
- Messages: New chat from inbox (MessagesTab "New message" + user search); chat search via `/api/messages/search`.
- Replies: Threaded UI in ReplySection (childrenByParent, loadChildren, expand).
- Topic card image: API returns `recentPostImageKey`; TopicCard displays image.
- Unread badge: UnreadMessagesContext + badge on Chats in nav and desktop sidebar.

**Remaining (known differences, no fix required for parity):**
- **Topic search** — Web `/api/search/topics` filters explore/topics; mobile uses Meilisearch for full-text topic search. Acceptable platform difference.
- **Settings section order** — Web has Privacy, Feed, Explore relevance; mobile has Offline reading. Intentional (web has no offline; extra sections are optional).


---

## Verification (browser)

- **Landing (localhost:3001):** Loads; sample post shows author image “Anna Weber”; cookie consent; footer.
- **Sign-in (localhost:3001/sign-in):** Email field, “Send verification code”, layout correct.
- **Search:** Requires /api/search/all and /api/search/posts — routes added; “All” and “Posts” tabs should work after deploy.
