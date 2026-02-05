# Scaling for Thousands of Users and Uploads

This document describes how to run the stack for **thousands of concurrent users** and **high upload volume**.

## Overview

- **API**: Stateless; scale by running multiple replicas behind a load balancer.
- **Image uploads**: Use **async moderation** so the API never blocks on the NSFW detector. Moderation runs in background workers that you can scale independently.
- **Postgres**: Single primary; use PgBouncer (already in place) for connection pooling. For very high write load, consider read replicas and read/write split in the app.
- **Redis**: Single instance is enough for queues and cache at this scale; use Redis Cluster only for much larger deployments.
- **NSFW detector**: With async moderation, the detector is no longer in the request path; scale workers (or detector replicas) to match queue throughput.

## 1. Async Content Moderation (text: posts & replies)

When **`MODERATION_CONTENT_ASYNC=true`**:

- **Post/reply create request**: No synchronous safety check. The post or reply is saved and a job is enqueued (existing `post-processing` / `reply-processing` queues). The API returns immediately.
- **Background workers**: The existing post worker and reply worker run the **full** content moderation (Stage 1 + Stage 2, including LLM). If content is not safe, they soft-delete the post/reply and record the moderation.

**Benefits:**

- Create latency no longer depends on Redis/embedding/LLM in the request path. You can scale API replicas without blocking on moderation.
- Workers (post-processing, reply-processing) can be scaled independently; each instance drains the queue.

**Configuration:**

- In `.env` or docker-compose: `MODERATION_CONTENT_ASYNC=true`
- When `false` (default): sync “Stage 1 only” check runs before save (fast path); worker still runs full check. When `true`: no sync check; worker does everything.

**Behaviour:**

- Posts and replies are **visible immediately** after create. If moderation fails in the worker, the post/reply is soft-deleted and the author’s content is removed from feeds/search.

---

## 2. Async Image Moderation (recommended for scale)

When **`MODERATION_IMAGE_ASYNC=true`**:

1. **Upload request**: Validate file → process (resize, WebP) → store in MinIO → enqueue a job → return the key immediately. **No synchronous call to the NSFW detector.**
2. **Background worker**: Picks up the job, downloads the image from MinIO, runs the NSFW check. If it fails: deletes the object and clears the key from the user profile or post.

**Benefits:**

- Upload latency is independent of detector load.
- You can run **multiple API replicas** and **multiple worker processes** (or pods). Each worker processes the queue at its own pace.
- The NSFW detector can be a single service (or a few replicas); the queue absorbs bursts.

**Configuration:**

- In `.env` or docker-compose:  
  `MODERATION_IMAGE_ASYNC=true`
- Ensure **Redis** is running (used for the `image-moderation` BullMQ queue).
- The **image-moderation worker** runs inside the same API process by default. For more throughput, run additional API instances (each runs its own worker) or split workers into a separate deployable (same codebase, worker-only process).

**Behaviour:**

- Images are **visible immediately** after upload. If moderation fails later, the image is removed from storage and the profile/post key is cleared (avatar or header disappears).
- For strict “no image visible until moderated” policies, you would need a different design (e.g. serve only after a “moderation passed” flag); the current design prioritises throughput and simplicity.

## 3. Horizontal Scaling of the API

- Run **multiple API containers** behind a load balancer (e.g. nginx or cloud LB).
- All API instances share the same **Redis**, **Postgres** (via PgBouncer), **MinIO**, **Meilisearch**, **Neo4j**.
- Use the same **JWT_SECRET** and **REDIS_URL** across instances so sessions and queues work correctly.
- With **async image moderation** enabled, each API instance can enqueue upload jobs; any instance (or dedicated worker processes) can run the image-moderation worker.

## 4. Scaling the NSFW Detector (optional)

If the **image-moderation** queue backs up even with many workers:

- Run **multiple replicas** of the `nsfw-detector` service behind a load balancer.
- Point **`MODERATION_IMAGE_SERVICE_URL`** at the load balancer so workers spread requests across replicas.
- Alternatively, use a **managed moderation API** (e.g. AWS Rekognition, Google Cloud Vision, Azure Content Safety) and adapt the API’s moderation client to call that instead of the local detector.

## 5. Database and Redis

- **Postgres**: PgBouncer is already in the stack; tune `default_pool_size` and `max_client_conn` as needed. For very high read load, add read replicas and route read-only queries in the app.
- **Redis**: Single instance is typical for queues and cache. Ensure `maxmemory` and eviction policy are set (e.g. in docker-compose or env). For much larger scale, consider Redis Cluster.

## 6. MinIO and Storage

- MinIO can be run in **distributed mode** for high availability and throughput; see MinIO docs.
- Ensure the bucket and policies are consistent across environments.

## 7. Summary Checklist for “Thousands of Users / Uploads”

| Area              | Action |
|-------------------|--------|
| Content (posts/replies) | Set `MODERATION_CONTENT_ASYNC=true` so create does not wait on safety check; workers do full moderation. |
| Image uploads     | Set `MODERATION_IMAGE_ASYNC=true`. |
| API               | Run multiple API replicas behind a load balancer. |
| Image moderation  | Scale by running more API instances (each runs the worker) or dedicated worker processes; optionally scale the NSFW detector or switch to a managed API. |
| Postgres          | Keep PgBouncer; tune pool size; add read replicas if read-heavy. |
| Redis             | Single instance with sensible `maxmemory`; use Cluster only if needed. |
| Meilisearch/Neo4j | Scale per vendor recommendations if search/graph load grows. |
