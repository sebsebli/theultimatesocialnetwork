# PgBouncer: Connection Pooling for PostgreSQL

When you run **multiple API replicas or many workers**, each process opens its own Postgres connections. The default `max_connections` on Postgres (often 100) can be exhausted. **PgBouncer** sits in front of Postgres and pools client connections so many API/worker processes share a smaller number of real DB connections.

## When to use

- You run several API instances (e.g. behind a load balancer) and/or multiple worker processes.
- You see Postgres errors like `too many connections` or connection timeouts under load.

## How it works

- Applications connect to **PgBouncer** (e.g. `postgres://user:pass@pgbouncer:6432/dbname`).
- PgBouncer maintains a pool of connections to the real Postgres and multiplexes client sessions onto them.
- Use **transaction mode** for typical REST APIs (default); session mode if you need prepared statements or advisory locks across requests.

## Docker Compose example

Add a PgBouncer service and point the API at it. Example override:

```yaml
# docker-compose.pgbouncer.yml (use with: docker compose -f docker-compose.yml -f docker-compose.pgbouncer.yml up -d)

services:
  pgbouncer:
    image: edoburu/pgbouncer:1.21.0
    container_name: citewalk-pgbouncer
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/postgres
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 200
      DEFAULT_POOL_SIZE: 25
    ports:
      - "127.0.0.1:6432:5432"
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "pg_isready", "-h", "127.0.0.1", "-p", "5432"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    environment:
      DATABASE_URL: postgres://postgres:postgres@pgbouncer:5432/postgres
    depends_on:
      pgbouncer:
        condition: service_started
```

Then set `DATABASE_URL` in your API environment to `postgres://user:pass@pgbouncer:5432/yourdb` (or `@pgbouncer:6432` if you map 6432 on the host).

## Configuration tips

- **POOL_MODE**: `transaction` for most APIs; `session` if you need long-lived session features.
- **DEFAULT_POOL_SIZE**: Number of server connections per database (e.g. 20–50); keep below Postgres `max_connections`.
- **MAX_CLIENT_CONN**: Max client connections to PgBouncer (e.g. 200); scale with number of API/worker processes.

## TypeORM / API

The API uses TypeORM with a single `DATABASE_URL`. Point `DATABASE_URL` at PgBouncer; no code changes are required. Ensure your migrations run against the **real Postgres** (not PgBouncer) if you use features that don’t work in transaction mode (e.g. `CREATE INDEX CONCURRENTLY`). For standard migrations, running them through PgBouncer is usually fine.

## Summary

- Add PgBouncer when you have many API/worker connections and hit Postgres connection limits.
- Configure `DATABASE_URL` to point at PgBouncer; keep pool sizes below Postgres `max_connections`.
- Use the Docker override above as a starting point; tune `DEFAULT_POOL_SIZE` and `MAX_CLIENT_CONN` for your load.
