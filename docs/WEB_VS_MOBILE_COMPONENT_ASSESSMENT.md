# Web vs Mobile — Component-by-Component Assessment

Assessment date: 2026-02-01.  
Compared: `apps/web` vs `apps/mobile` (structure, UI, data, behavior).

---

## 1. Navigation & Layout

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Tab bar (mobile)** | 5 tabs: Home, Discover, Compose (center pill), Chats, Profile. Icons: MaterialIcons `home`, `search`, `edit`, `chat-bubble-outline`, `person`. | Bottom nav: same 5 items, same labels (Home, Discover, Post, Chats, Profile). Icons: inline SVGs (home, magnifier, pencil, chat bubbles, person). | ✅ Aligned |
| **Desktop sidebar** | N/A (tabs only). | Left sidebar: logo, Home, Discover, Post (pill), Chats, Profile, divider, Collections, Keeps, Settings. | ✅ Web has extra items (Collections, Keeps, Settings) — correct for desktop. |
| **Compose entry** | Tab opens `/post/compose`. | Nav link to `/compose`. | ✅ Aligned |
| **Chats label** | "Chats". | "Chats" (nav translation). | ✅ Aligned |
| **Unread badge** | `tabBarBadge` on Chats from `unreadMessages`. | UnreadMessagesContext + badge on Chats (nav + desktop sidebar). | ✅ Fixed |

---

## 2. Home / Feed

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Feed source** | Feed API, post items. | Feed API, `FeedList` + `PostItem`. | ✅ Aligned |
| **Post item author** | Avatar (image or initial), name, time. | `Avatar` component: image when `avatarKey`/`avatarUrl`, else initial. | ✅ Aligned (avatars fixed) |
| **Post item actions** | Like, Reply, Quote, Keep, Add to collection, Share, Overflow (report/delete). Order: like → reply → quote → keep → collection → share → more. | Like, Reply, Quote, Keep, Add to collection, Share, Overflow. Same order. | ✅ Aligned |
| **Saved-by items** | Shown in feed when post saved to collection. | `SavedByItem` in feed. | ✅ Aligned |
| **Suggestions when empty** | Suggested users. | Fetches `/api/users/suggested`, `UserCard`. | ✅ Aligned |
| **Infinite scroll** | Load more on scroll. | Load more. | ✅ Aligned |

---

## 3. Explore / Discover

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Tabs** | quoted, deep-dives, newsroom, topics, people. Default: **quoted**. | Same tab ids, labels: Quoted Now, Deep Dives, Newsroom, Topics, People. Default: **quoted**. | ✅ Aligned |
| **Tab order** | quoted → deep-dives → newsroom → topics → people. | Same. | ✅ Aligned |
| **Endpoints** | `/explore/quoted-now`, deep-dives, newsroom, topics, people. | Same via `/api/explore/*`. | ✅ Aligned |
| **Search bar** | Tappable bar → `/search`. | Link styled as search bar → `/search`. | ✅ Fixed |
| **Sort/filter** | `sort=recommended` in API. | "Sort Options" button + API sort. | ✅ Aligned |
| **Topic cards** | `TopicCard`: image (header/recent post) or topic icon, title, "X posts · Y followers", Follow, optional description. | `TopicCard`: `recentPostImageKey` from API, image when present; title, "X posts", "Y followers", Follow. | ✅ Fixed (API + TopicCard image) |
| **People cards** | `UserCard`: avatar (image or initial), name, handle, bio, Follow, WhyLabel. | `UserCard`: `Avatar`, name, handle, bio, Follow, WhyLabel. | ✅ Aligned (with Avatar) |
| **Post list** | `PostItem` with WhyLabel on hover/overlay. | `PostItem` with WhyLabel (hover). | ✅ Aligned |

---

## 4. Post Item (single post in lists)

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Author row** | Avatar (image or initial), displayName, time. | `Avatar` + displayName + time. | ✅ Aligned |
| **Body / title** | Markdown, optional title, truncation. | Markdown, optional title. | ✅ Aligned |
| **Header image** | Optional, aspect, blurhash. | Optional, blurhash, `getImageUrl(headerImageKey)`. | ✅ Aligned |
| **Sources section** | External, post, topic links. | Same in `PostItem`. | ✅ Aligned |
| **Like** | Heart, optimistic, API. | Same. | ✅ Aligned |
| **Reply** | Comment icon, link to post#reply. | Same. | ✅ Aligned |
| **Quote** | Quote icon, link to compose?quote=. | Same. | ✅ Aligned |
| **Keep** | Bookmark icon, API. | Same. | ✅ Aligned |
| **Add to collection** | Sheet. | `AddToCollectionModal`. | ✅ Aligned |
| **Share** | Share sheet. | Copy URL + native share if available. | ✅ Aligned |
| **Overflow** | Report, Delete (own), Copy link. | `OverflowMenu`: same. | ✅ Aligned |
| **Private like count** | Shown for author. | Shown for author. | ✅ Aligned |

---

## 5. Post Detail & Reading Mode

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Author** | Avatar, name, handle, time. | `Avatar` + name + handle + time. | ✅ Aligned |
| **Reading mode** | Full-screen reading view. | `/post/[id]/reading` + `ReadingMode`. | ✅ Aligned |
| **Replies** | Threaded, author avatar. | `ReplySection`, `Avatar` for reply author. | ✅ Aligned (API now returns author avatar for replies) |
| **Referenced by** | Quotes that reference this post. | `ReferencedBySection`, `Avatar` for author. | ✅ Aligned (API serializes with avatar) |
| **Sources** | Section. | `SourcesSection`. | ✅ Aligned |

---

## 6. Profile Page

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Header image** | Optional cover (profileHeaderKey/Url). | Same. | ✅ Aligned |
| **Avatar** | Image or initial, edit badge for self. | `Avatar` + edit for self, upload. | ✅ Aligned |
| **Name, handle, bio** | displayName, @handle, bio. | Same. | ✅ Aligned |
| **Stats** | Followers, Following, Quotes received. | Same. | ✅ Aligned |
| **Tabs** | Posts, Replies, Quotes, Saved, Collections. | posts, replies, quotes, saved, collections. | ✅ Aligned |
| **Options menu** | Back, Settings / Edit background, more. | `ProfileOptionsMenu`. | ✅ Aligned |

---

## 7. User Profile (other user)

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Header + avatar** | Same pattern, no edit. | Same. | ✅ Aligned |
| **Follow / Message** | Buttons. | Same. | ✅ Aligned |
| **Posts / Replies / Quotes** | Tabs. | Same. | ✅ Aligned |

---

## 8. Settings

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Section order** | Account → Content → Offline reading → Safety → Legal → Sign out. | Account, Privacy, Content, Email, Feed, Explore relevance, Safety, Legal, Sign out. | ⚠️ **Gap:** Web has different order and extra sections (Privacy, Feed, Explore relevance). Mobile has "Offline reading" (web correctly omits for web). |
| **Account** | Edit profile, Invite Friends, Languages. | Edit profile, Invite Friends, Languages. | ✅ Aligned |
| **Content** | Relevance, Notifications. | Relevance, Notifications. | ✅ Aligned |
| **Offline reading** | Toggle "Download saved for offline", "Manage offline storage". | Not present (native-only). | ✅ Omitted on web is correct. |
| **Safety** | Blocked, Muted. | Blocked, Muted. | ✅ Aligned |
| **Legal** | Terms, Privacy, Imprint, My RSS Feed, Request my data, Danger zone. | Terms, Privacy, Imprint, My RSS Feed, Request my data, Danger zone. | ✅ Aligned |
| **Sign out** | Separate section, destructive. | Same. | ✅ Aligned |
| **Request my data** | Modal, API. | Button, API. | ✅ Aligned |

---

## 9. Messages / Inbox

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Thread list** | otherUser avatar, name, last message, unread badge. | `Avatar` for otherUser, name, last message, unread. | ✅ Aligned (API returns otherUser.avatarKey) |
| **Open thread** | Header: otherUser avatar, name, handle. | Same with `Avatar`. | ✅ Aligned |
| **Message bubbles** | Sender vs current user styling. | Same. | ✅ Aligned |
| **Compose** | Input + Send. | Same. | ✅ Aligned |

---

## 10. Compose

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Quote prefill** | From post ID. | `compose?quote=`. | ✅ Aligned |
| **Title, body, header image** | Same. | Same. | ✅ Aligned |
| **Wikilinks / topics** | Supported. | Same. | ✅ Aligned |
| **Publish** | API create post. | Same. | ✅ Aligned |

---

## 11. Collections & Keeps

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Collections list** | Collections index. | `/collections`. | ✅ Aligned |
| **Collection detail** | Items, add/remove. | Same. | ✅ Aligned |
| **Keeps** | Saved posts. | `/keeps`. | ✅ Aligned |
| **Add to collection** | From post overflow/sheet. | `AddToCollectionModal`. | ✅ Aligned |

---

## 12. Topic Page

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Header** | Topic title, image, follow. | Same. | ✅ Aligned |
| **Posts** | List of posts. | Same. | ✅ Aligned |
| **Top authors** | Placeholder / coming soon. | "Coming soon". | ✅ Aligned |

---

## 13. Search

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Entry** | Explore search bar → `/search`. | Explore search bar links to `/search`. | ✅ Fixed |
| **Search page** | People, topics, posts. | `/search` page exists. | ✅ Present |

---

## 14. Onboarding

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Steps** | Languages → Profile → Starter packs. | Same order. | ✅ Aligned |
| **Redirect** | After sign-in if `needsOnboarding`. | Same. | ✅ Aligned |

---

## 15. Auth & Sign-in

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Flow** | Email → code → verify. | Same. | ✅ Aligned |
| **Beta / invite** | Invite code when required. | Beta mode API, invite field when required. | ✅ Aligned |
| **Terms checkbox** | Shown when invite required. | Same. | ✅ Aligned |

---

## 16. Avatar & Images (summary)

| Area | Mobile | Web | Status |
|------|--------|-----|--------|
| **Post author** | avatarKey/avatarUrl or initial. | `Avatar` with avatarKey/avatarUrl or initial. | ✅ Aligned |
| **Reply author** | API returns author; avatar shown. | API now `replyToPlain(..., getImageUrl)`; `Avatar` in ReplySection. | ✅ Aligned |
| **User cards** | avatarKey/avatarUrl or initial. | `Avatar` in UserCard. | ✅ Aligned |
| **Profile** | avatarKey/avatarUrl, header. | Same. | ✅ Aligned |
| **Messages otherUser** | API returns user; avatar in list/header. | API threads include otherUser.avatarKey; `Avatar` in MessagesTab. | ✅ Aligned |
| **Referenced-by author** | post author. | API referenced-by uses postToPlain with getImageUrl; `Avatar` in ReferencedBySection. | ✅ Aligned |
| **Suggested users** | withAvatarUrl. | Same from API. | ✅ Aligned |
| **Image URL** | `getImageUrl(key)` → API base + `/images/${key}`. | Same in `lib/security.ts`. | ✅ Aligned |

---

## Summary: Gaps (current)

**Addressed:** Explore search bar → `/search`; TopicCard image via `recentPostImageKey`; Unread messages badge (UnreadMessagesContext + nav/sidebar).

**Remaining (optional):** Settings section order differs from mobile (web has Privacy, Feed, Explore relevance; mobile has Offline reading). Intentional for platform.

---

## Already Aligned (no change needed)

- Navigation items and labels (Home, Discover, Chats, Profile, compose).
- Explore tab order and labels (Quoted Now, Deep Dives, Newsroom, Topics, People).
- Post item action bar order and actions (like, reply, quote, keep, collection, share, overflow).
- Profile images (Avatar) across post item, post detail, reading mode, replies, referenced-by, user card, sidebar, messages, profile.
- API returning avatar for replies, referenced-by, and message threads.
- Settings sections content (Account, Content, Safety, Legal, Sign out, Request data, Danger zone, RSS).
- Onboarding flow and redirect.
- Sign-in flow and beta/invite handling.
