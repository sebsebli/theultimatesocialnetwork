# Scalability: Thousands of Users, Hundreds of Thousands of Posts

This document summarizes how the current infrastructure behaves at scale (thousands of users, hundreds of thousands of posts and interactions) and what to change when you grow further.

## What Works at This Scale

- **PostgreSQL** – Paginated queries (`limit`/`offset` or `take`/`skip`) are used for feeds, topic posts, search, keeps, etc. Indexes exist on `posts(created_at)`, `posts(author_id)`, `posts(lang)`, and other hot columns. A single Postgres instance can handle this load with adequate CPU/RAM and disk.
- **Meilisearch** – Search is index-based; query latency stays low as document count grows. **Reindex from PostgreSQL** is now **batched** (1,000 posts per batch) so it does not load the full table into memory and scales to hundreds of thousands of posts.
- **Neo4j** – Graph size (nodes/edges) scales with users and posts; at hundreds of thousands of posts the graph is still manageable for a single Neo4j instance.
- **Redis** – Used for feed cache, rate limiting, and queues. Memory grows with cached feed slices and queue depth; eviction policies and maxmemory should be set (see below).
- **MinIO** – Object storage scales with total object count and size; backup time grows with bucket size but remains feasible.
- **API** – Stateless; you can run multiple API replicas behind a load balancer when needed.
- **Backups** – `pg_dump` streams to gzip (bounded memory). Full backup (Postgres + Neo4j + MinIO) runs every 6 hours; retention (e.g. 7 days) limits disk use.

## What to Monitor and Tune

### 1. PostgreSQL

- **Connections** – Default `max_connections`; if you run many API replicas or workers, use a connection pooler (e.g. PgBouncer) in front of Postgres.
- **Slow queries** – Enable `log_min_duration_statement` and watch for high `offset` on feeds (e.g. `skip(10000)` is expensive). Consider cursor-based pagination for “infinite scroll” feeds at very high depth.
- **Disk and WAL** – Ensure enough space for data and WAL; replication if you need HA.

### 2. Feed and offset-based pagination

- Feed uses `skip(offset).take(limit)`. For large `offset` (e.g. page 500), Postgres still has to walk past many rows. For typical usage (first few pages) this is fine. If you see slow feed requests for deep pagination, consider switching to **cursor-based pagination** (e.g. `WHERE created_at < :cursor ORDER BY created_at DESC LIMIT 20`).

### 3. Redis

- Set **maxmemory** and **eviction policy** (e.g. `volatile-lru` or `allkeys-lru`) so Redis does not grow unbounded under load.
- Feed cache: number of cached keys grows with active users; monitor memory and hit rate.

### 4. Meilisearch reindex

- Reindex runs in the background when the posts index is empty (e.g. after restore). With hundreds of thousands of posts it may take several minutes; the API stays up. If you run reindex very often (e.g. `MEILISEARCH_REINDEX_ON_STARTUP=true`), consider running it only when needed (e.g. after restore).

### 5. Full backup (Postgres + Neo4j + MinIO)

- **Postgres** – `pg_dump` is streaming; duration and file size grow with data (e.g. hundreds of thousands of posts → larger dump and longer run).
- **Neo4j** – APOC Cypher export can be slow and produce a large file for big graphs; the 6-hour window between runs should usually be enough.
- **MinIO** – Mirror time grows with bucket size; ensure the backup job finishes before the next run or add simple locking/skip-if-still-running logic if needed.
- **Retention** – `FULL_BACKUP_KEEP_DAYS` (default 7) limits backup disk usage; adjust if you need longer retention.

### 6. Post worker (embeddings + Neo4j + Meilisearch)

- Each new post is processed by a worker (embedding, search index, graph). Under high write throughput, ensure the queue (Redis/Bull) has enough consumers and that Ollama (or your embedding service) and Neo4j can keep up. Scale workers horizontally if needed.

## When to Change Architecture

- **Very large scale (millions of users, tens of millions of posts)** – Consider dedicated read replicas for Postgres, sharding or partitioning for posts, dedicated Meilisearch/Neo4j clusters, and a proper queue/worker fleet. The patterns used here (paginated reads, batched reindex, stateless API) still apply, but you will add more components and tuning.
- **High availability** – Add Postgres replication, Redis Sentinel or cluster, and multiple API/worker replicas behind a load balancer.

## Summary

The stack is designed so that **thousands of users and hundreds of thousands of posts** are supported with the current design: paginated queries, indexes, batched Meilisearch reindex, streaming backups, and stateless API. Monitor Postgres slow queries, Redis memory, backup duration, and worker lag; tune connection pooling, Redis eviction, and optional cursor-based feed pagination as you grow.
