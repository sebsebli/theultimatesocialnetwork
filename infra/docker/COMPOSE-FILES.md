# Docker Compose files – what runs when

## Summary

| Compose file | When it's used | Purpose |
|--------------|----------------|---------|
| **docker-compose.yml** | **Always** (base stack) | Full stack: db, pgbouncer, neo4j, redis, meilisearch, minio, ollama, nsfw-detector, api, web, nginx, backup-full. API connects to Postgres via PgBouncer. |
| **docker-compose.prod.yml** | Only with **prod** deploy | Overrides for production: nginx SSL, MinIO no ports, Redis memory. |

## Deploy script behaviour

- **Local:** `./scripts/deploy.sh local` → **docker-compose.yml**.  
  - App: http://localhost — API: http://localhost/api  
  - Nginx uses `nginx.local.conf` (no rate limits). API connects via PgBouncer.

- **Production:** `./scripts/deploy.sh prod` → **docker-compose.yml + docker-compose.prod.yml**.  
  - Nginx uses SSL config; MinIO has no published ports; API connects via PgBouncer.

## API and the stack

The API is part of the same stack. When you run a deploy:

1. All services in the chosen compose set are started (db, pgbouncer, redis, api, web, nginx, etc.).
2. API connects to Postgres **via PgBouncer** (configured in docker-compose.yml: API `DATABASE_URL` → pgbouncer, pgbouncer → db).
3. Nginx proxies `/api` to the API container; the app and mobile use that base URL.
4. `PUBLIC_API_URL` (in docker-compose.yml for the api service) is set so image URLs in API responses work (GET /api/images/:key).

So: **one deploy = one stack**. The API is not deployed separately from the rest; it runs as part of that stack and works with the same compose files.

---

## Agents and mobile when using local Docker

After you run `./scripts/deploy.sh local`, the API is at **http://localhost/api**. Configure clients so they reach that URL.

### Agents (`agents/.env`)

- **CITE_API_URL** = `http://localhost/api` (API behind nginx; agents run on the same machine.)
- **CITE_ADMIN_SECRET** must match **CITEWALK_ADMIN_SECRET** in `infra/docker/.env` if you use admin endpoints (e.g. `--seed-db`, invite generation).

Example for local Docker:

```bash
CITE_API_URL=http://localhost/api
CITE_ADMIN_SECRET=<same as infra/docker/.env CITEWALK_ADMIN_SECRET>
```

### Mobile (`apps/mobile/.env`)

- **EXPO_PUBLIC_API_BASE_URL** must be a URL the device/simulator can reach:
  - **Simulator on same machine:** `http://localhost/api`
  - **Physical device on same LAN:** `http://YOUR_LAN_IP/api` (e.g. `http://192.168.0.79/api`). Use your machine’s IP so the phone can reach nginx.

Ensure `infra/docker/.env` has **CORS_ORIGINS** that includes your Expo origin (e.g. `http://192.168.0.79`, `exp://192.168.0.79:8081`) when testing from a device.
