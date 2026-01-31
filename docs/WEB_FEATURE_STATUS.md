# Web App – Feature Status vs Mobile

**Short answer:** All remaining pages and features are now implemented. Public profile and public post pages are viewable without authentication (interaction and comments locked).

---

## ✅ Implemented (parity with mobile)

| Area | Web | Notes |
|------|-----|--------|
| **Home** | `/home` | Feed, suggestions, invite nudge, pagination |
| **Compose** | `/compose`, `/compose/quote` | Validation, formatting, preview, image upload |
| **Explore** | `/explore` | Topics, People, Quoted, Deep Dives, Newsroom, follow/unfollow |
| **Search** | `/search` | Search people, topics, posts |
| **Profile (user)** | `/user/[handle]` | Posts, replies, quotes, saved, collections, follow, message |
| **Collections** | `/collections`, `/collections/[id]` | List, detail, create, edit, delete |
| **Keeps** | `/keeps` | Keeps library |
| **Post detail** | `/post/[id]`, `/post/[id]/reading` | Post view, reading mode, replies (ReplySection), like, keep, quote, share, add to collection |
| **Topic** | `/topic/[slug]` | Topic page, follow |
| **Settings** | `/settings` | Main settings + **sub-pages:** `/settings/profile`, `/settings/languages`, `/settings/notifications`, `/settings/blocked`, `/settings/muted`, `/settings/relevance` |
| **Inbox** | `/inbox` | Notifications tab + Messages tab (thread list, thread view, send message) |
| **Messages** | Inbox → Messages tab | Thread list, open thread, send message; "Message" on profile creates thread and redirects to inbox |
| **Onboarding** | `/onboarding/languages`, `/onboarding/profile`, `/onboarding/starter-packs` | Same flow as mobile |
| **Auth / misc** | `/sign-in`, `/welcome`, `/waiting-list`, `/invites`, `/invite/[handle]`, `/verify` | Sign-in, welcome, waitlist, invites, verify |
| **Legal / info** | `/terms`, `/privacy`, `/imprint`, `/ai-transparency`, `/manifesto`, `/roadmap` | Legal and product pages |

---

## ✅ Public profile and public post (no auth)

| Feature | Behavior |
|---------|----------|
| **Public profile** | `/user/[handle]` is accessible without login. Middleware allows `/user/*` as public. Profile fetches without token; when unauthenticated: Follow/Message hidden, "Sign in to follow" shown, only Posts tab, Followers/Following are counts only (no link to connections), back goes to `/`. |
| **Public post** | `/post/[id]` is accessible without login. Middleware allows `/post/*` as public. Post fetches without token; when unauthenticated: like/reply/keep/share/add actions hidden, ReplySection (comments) hidden, "Sign in to like, reply, or comment" shown, back goes to `/`. |

## ✅ Remaining features (all done)

| Feature | Web | Status |
|---------|-----|--------|
| **User connections page** | `/user/[handle]/connections?tab=followers\|following` | Implemented. Followers/Following tabs, UserCard list, follow/unfollow. Linked from profile (Followers/Following counts). |
| **Inbox ?thread=** | `/inbox?thread=<id>` | Implemented. Inbox reads `thread` query param, switches to Messages tab, MessagesTab opens that thread. |
| **Settings: offline storage** | N/A | Mobile-only. |
| **Settings: danger zone** | Inline on main settings | Same behavior. |
| **Post: nested reply view** | Replies on post page | No dedicated deep-link to a reply; parity acceptable. |
| **Layout / component patterns** | Ad-hoc Tailwind | Design tokens shared; layout specs optional follow-up. |

---

## Summary

- **Pages:** All major screens and remaining features (Connections, inbox thread param) are implemented.
- **Public access:** Profile and post are viewable without authentication; interaction and comments are locked; sign-in prompts where appropriate.
- **N/A on web:** Offline storage settings.
