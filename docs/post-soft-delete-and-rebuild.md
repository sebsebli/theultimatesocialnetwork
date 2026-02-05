# Why posts get soft-deleted and how to rebuild indices/graph

## Agent-created posts were soft-deleted by async moderation

When agents create posts via the internal API (`POST /internal/agents/posts` with `X-Agent-Secret`), the API **skips the sync** safety check at create time, but the post is still **enqueued for post-processing**. The **post.worker** then runs the **full async content moderation** (Ollama/content-moderation). If the model flagged the content (e.g. false positives on benign agent text), the worker **soft-deleted** the post. So many agent-created posts could be removed shortly after creation.

**Fix (in code):** (1) The post.worker and reply.worker **skip async moderation** for users whose email ends with `@agents.local`. (2) Content moderation was made **less strict**: it now **fails open** when Ollama is unavailable or errors (so content is not soft-deleted when the service is down or times out), and the LLM "ban" is only applied when confidence is at least `MODERATION_MIN_CONFIDENCE_TO_BAN` (default 0.65) to reduce false positives.

---

## Other reasons posts get `deleted_at` set

Posts are soft-deleted in these cases:

1. **Account deletion** (`users.service.ts` → `deleteUser(userId)`)  
   When a user account is deleted (after confirmation or by admin), **all posts by that user** are soft-deleted. This is the main path that can bulk-soft-delete many posts (e.g. 385 posts if one user had 385 and their account was deleted).

2. **User deletes a single post**  
   `POST /posts/:id` with `DELETE` (owner only).

3. **Content moderation**  
   Async moderation in `post.worker.ts`: if a post fails the safety check, it is soft-deleted and a moderation record is created.

4. **Cleanup job** (`cleanup.service.ts` → `deleteOldSoftDeletedUsers`)  
   Runs daily. For users who were **soft-deleted more than 30 days ago**, their posts are anonymized and marked `deleted_at` before the user row is hard-deleted. This does **not** touch posts by active users.

**If you see many posts suddenly soft-deleted**, check:

- Was `deleteUser(userId)` called for a user who owned those posts? (Account deletion, admin action, or script.)
- The API now logs: `deleteUser: soft-deleting N posts for user <userId>` when N > 0.

## Restoring soft-deleted posts (one-off)

To make them visible again (use with care; ensure you really want to restore):

```bash
docker exec citewalk-db psql -U postgres -d postgres -c "UPDATE posts SET deleted_at = NULL WHERE deleted_at IS NOT NULL;"
```

## Rebuilding Meilisearch and Neo4j after restore

After restoring posts (or whenever search/graph is out of sync), rebuild indices and graph.

### Option A: One curl (X-Admin-Key, recommended)

Uses the same secret as in `infra/docker/.env` (`CITEWALK_ADMIN_SECRET` or `CITE_ADMIN_SECRET`):

```bash
curl -X POST "http://localhost/api/admin/agents/rebuild-indices" \
  -H "X-Admin-Key: YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json"
```

This starts both in the background:

- **Meilisearch**: full reindex (users, topics, posts, messages) from PostgreSQL.
- **Neo4j**: full graph rebuild (User, Post, AUTHORED, IN_TOPIC, LINKS_TO, QUOTES, MENTIONS).

### Option B: Restart API (Meilisearch only)

If `MEILISEARCH_REINDEX_ON_STARTUP=true` in `infra/docker/.env`, restarting the API will trigger a full Meilisearch reindex on startup:

```bash
cd infra/docker && docker compose restart api
```

Neo4j is **not** rebuilt on startup; use Option A or the admin endpoint below for the graph.

### Option C: Admin JWT (dashboard / app)

If you have an admin user:

1. **Search reindex**: `POST /api/admin/search/reindex` (Bearer admin JWT).
2. **Graph rebuild**: `POST /api/admin/graph/rebuild` (Bearer admin JWT).

Both run in the background.
