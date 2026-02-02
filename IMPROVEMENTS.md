# Production Readiness Improvements

The following improvements have been identified to make the system production-ready.

## High Priority (Security & Config)

- [x] **Environment Variable Validation**: implemented using `Joi` in `AppModule`.
- [x] **CORS Configuration**: Restrict `origin` in `main.ts` and `RealtimeGateway` to production domains only (currently `'*'` or default).
- [x] **SSL/TLS**: Ensure Database SSL uses `rejectUnauthorized: true` in production with proper CA certificates.

## Medium Priority (Resilience)

- [x] **Neo4j Reconnection**: Implement retry logic in `Neo4jService` to handle temporary database outages.
- [x] **Queue Dead Letter Queues**: Configure BullMQ to move failed jobs to a specific queue for manual inspection.
- [x] **Rate Limiting**: Verify Throttler limits are appropriate for production traffic.

## Low Priority (Performance & Maintainability)

- [ ] **Performance Audit**: Check for N+1 queries in `RecommendationService` and `PostsService`.
- [ ] **E2E Tests**: Expand test coverage in `test/` directory.

---

## Safety, Performance & Stability (Ongoing)

### Implemented

- [x] **Request body size limit**: JSON/urlencoded limited via `BODY_LIMIT` (default `1mb`) in `main.ts` to reduce DoS from huge payloads.
- [x] **Image moderation timeout**: Ollama image analysis uses `OLLAMA_IMAGE_TIMEOUT_MS` (default 15s); on timeout we fail open (allow image) and log.
- [x] **WebSocket Redis adapter**: Clear error message and log when Redis connection fails at startup so failures are obvious in logs.

### Recommended (see also `docs/SECURITY_AUDIT.md`, `docs/SCALABILITY.md`) — implemented

- [x] **HTTPS**: When `ENFORCE_HTTPS=true` in production, requests without `X-Forwarded-Proto: https` are rejected (403). Use behind a TLS-terminating proxy.
- [x] **Health scope**: When `HEALTH_SECRET` is set, full `GET /health` (DB/Redis details) requires `X-Health-Secret` header or request from private IP; otherwise returns minimal `{ status, timestamp }`. Use `GET /health/live` for external LB.
- [x] **Redis**: Docker Compose sets `--maxmemory` and `--maxmemory-policy allkeys-lru` (default 256MB dev, 512MB prod via `REDIS_MAXMEMORY`).
- [x] **Cursor-based pagination**: Feed supports `?cursor=<ISO date>`; response includes `nextCursor` for stable deep pagination. Web and mobile clients use cursor for “load more”.
- [x] **Connection pooler**: `docs/PGBOUNCER.md` and optional `infra/docker/docker-compose.pgbouncer.yml` for PgBouncer in front of Postgres.
- [x] **Global throttle**: Configurable via `THROTTLE_LIMIT` (default 60) and `THROTTLE_TTL_MS` (default 60000) in `app.module.ts`.

### Frontend (Web & Mobile) — implemented

- [x] **Reusable components memoization**: Presentational and list-item components wrapped with `React.memo` on both web and mobile for fewer re-renders (see `apps/web/components/README.md` and `apps/mobile/components/README.md`).
- [x] **Mobile list performance**: `FLATLIST_DEFAULTS` (theme), `ListFooterLoader`, `SectionHeader`, and consistent `EmptyState` usage across feeds, profile, explore, search, and settings.
- [x] **Empty-state consistency**: All list/sheet empty states use shared `EmptyState` (chat thread, post quotes, reading “Quoted by”, collections, AddToCollectionSheet, messages inbox/new, offline-storage). Inline empty text removed; unused `emptyText`/`emptyState` styles cleaned up.
- [x] **Web error reporting hook**: `lib/error-reporting.ts` + wiring in `ErrorBoundary` and `error.tsx`; production can set `window.__reportError` (e.g. Sentry) for one-line integration.
- [x] **Web explore code-splitting**: `ExploreContent` loaded via `next/dynamic` with skeleton fallback so explore tab JS is in a separate chunk.
