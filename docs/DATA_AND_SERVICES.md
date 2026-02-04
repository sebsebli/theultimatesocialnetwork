# Data Stores and How They Work Together

## Postgres (primary store)

- **Role:** Source of truth for all app data (users, posts, replies, invites, sessions, etc.).
- **Migrations:** All TypeORM entities have a corresponding table created by migrations. Nothing is missing.

### Entity → migration coverage

| Entity (table) | Migration |
|----------------|-----------|
| users, posts, topics, post_topics, reports, replies, invites, notification_prefs, sessions, follows, system_settings | InitialSchema + AddSystemSettings |
| reply_likes | AddReplyLikes |
| moderation_records | AddModerationRecords |
| account_deletion_requests | AddAccountDeletionRequests |
| data_exports | AddDataExportAndLastExportRequested |
| mentions, dm_threads, dm_messages, notifications, blocks, mutes | AddMentionsDmNotificationsBlocksMutes |
| post_edges, post_reads, likes, keeps, collections, collection_items, external_sources, follow_requests, topic_follows, push_tokens, push_outbox, waiting_list | AddRemainingPostgresTables |

Plus incremental migrations for new columns (onboarding, avatar, profile header, public_id, invite lifecycle, etc.). **All 33 entities are covered.**

- **Health:** `GET /health` reports `services.database` (up/down). Migrations run on API start via `entrypoint.sh`; failure exits the container.

---

## Neo4j (graph store)

- **Role:** Graph layer for recommendations and social graph (follows, post/reply links). Data is written from Postgres (workers/services run Cypher on create/update).
- **Connection:** `Neo4jService` (DatabaseModule), config: `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`. Connects on API init; if connection fails, app still starts and graph features return empty until Neo4j is back.
- **Health:** `GET /health` reports `services.neo4j` (up/down). Neo4j down does not fail readiness; app degrades gracefully (empty graph results).
- **Docker:** API `depends_on: neo4j`; env: `NEO4J_URI: bolt://neo4j:7687`.

---

## Meilisearch (search index)

- **Role:** Full-text and vector search (posts, users, topics, DMs). **Search does not query the full database** — it only returns documents that have been indexed in Meilisearch. Data is indexed from Postgres when entities change (workers and services call MeilisearchService).
- **Connection:** `MeilisearchService` (SearchModule), config: `MEILISEARCH_HOST`, `MEILISEARCH_MASTER_KEY`. Indexes created in `onModuleInit`; init errors are logged, app still starts.
- **Health:** `GET /health` reports `services.meilisearch` (up/down). Meilisearch down does not fail readiness; search endpoints may error or return empty.
- **Docker:** API `depends_on: meilisearch`; env: `MEILISEARCH_HOST: http://meilisearch:7700`.

### When search might not show results

- **Posts:** Indexed when a post is created or published (immediate best-effort index + worker for embedding/topicIds). If the worker or Redis is down, new posts are still indexed immediately but without vector/topicIds until reindex.
- **Users:** Indexed on profile update and email change. New users (signup) are not indexed until they complete onboarding or update their profile; users with placeholder handles (`__pending_*`) are excluded from search results.
- **Topics:** Indexed when created via a post (e.g. first use of `[[topic-slug]]`). Topics created by seed scripts or manually in DB only appear in search after a full reindex.
- **After restore / empty index:** If the Meilisearch index is empty (e.g. after restore), the API runs a full reindex from Postgres on startup. You can also set `MEILISEARCH_REINDEX_ON_STARTUP=true` to force reindex on every start.
- **Admin reindex:** `POST /admin/search/reindex` (admin role) triggers a full reindex in the background. Use when search is missing data and you want to sync from Postgres without restarting.

---

## How they work together

1. **Postgres** = primary store. All writes go here; migrations ensure schema is complete.
2. **Neo4j** = graph mirror. Posts, replies, follows trigger Cypher writes so recommendations and graph queries work. If Neo4j is down, those features return empty; core app (CRUD, auth, feed from Postgres) still works.
3. **Meilisearch** = search index. Posts, users, topics, DMs are indexed on create/update. Search and “similar content” read from Meilisearch. If Meilisearch is down, search degrades; rest of app works.

All three are wired in Docker Compose and in the API (DatabaseModule + SearchModule). Health check reports all three so you can see connectivity at a glance.
