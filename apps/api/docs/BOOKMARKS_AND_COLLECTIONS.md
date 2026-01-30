# Bookmarks (Keeps) vs Collections vs Topics

## Collections are not Topics

- **Topics** = System-defined categories (e.g. Technology, Science, Politics). Curated by the platform. Users follow topics to personalize their feed and explore.
- **Collections** = User-created folders (e.g. "Research", "To read", "Design"). Each user organizes their own saves into named lists. Can be public or private.

So: **collections are not topics** — topics are global categories; collections are your personal folders.

---

## Bookmarks (Keeps)

- **Private only.** Your "Saved" list is never public.
- **Single list.** One list per user: all bookmarked posts in one place.
- **Quick save.** One tap to add/remove from your saves.
- **API:** `keeps` table (`user_id`, `post_id`). Endpoints: `POST/DELETE /posts/:id/keep`.

**Use case:** "Save for later" without organizing. Like an unorganized inbox of saves.

## Collections

- **Can be public or private.** Each collection has `isPublic` and `shareSaves`.
- **Multiple named folders.** e.g. "Research", "Design", "To read".
- **Followable.** When public and `shareSaves` is on, others can see that you saved a post to a collection (used in feed: "X saved this to Collection Y").
- **API:** `collections` + `collection_items`. Endpoints: `GET/POST /collections`, `POST /collections/:id/items` (add post), etc.

**Use case:** Organize saves into topics; optionally share lists with others.

## Do we need both?

Yes. They serve different needs:

- **Bookmark** = fast, private, unorganized save.
- **Collection** = organized, optionally public/followable.

Conceptually, "bookmark" could be implemented as a default "Saved" collection under the hood, but we keep both for: (1) one-tap save without picking a folder, (2) a single private list that is never exposed.
