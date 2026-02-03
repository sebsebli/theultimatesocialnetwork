# Which .env file is used where?

This repo has several `.env` files because different parts of the system run in different contexts (local dev, Docker, web app, mobile app). Here’s how they’re used.

---

## Quick reference

| File | Used by | When |
|------|--------|------|
| **`.env`** (repo root) | API, DB migrations, scripts | Running the API and web from the repo (e.g. `npm run start:dev` in `apps/api`) |
| **`infra/docker/.env`** | Docker Compose | Running `docker compose up` or `./scripts/deploy.sh` from **repo root** |
| **`apps/mobile/.env`** | Expo / React Native | Running the mobile app (e.g. `npx expo start` in `apps/mobile`) |
| **`apps/web/.env`** or **`.env.local`** | Next.js | Running the web app (e.g. `npm run dev` in `apps/web`) — optional; Next loads from `apps/web` by default |

---

## 1. Root `.env` (repo root)

- **Who uses it**
  - **API** when run **outside Docker**: `apps/api` uses `envFilePath: '../../.env'` (Nest `ConfigModule`), so it loads the **repo root** `.env`.
  - **TypeORM** (migrations, `data-source.ts`) loads `../../../.env` from `apps/api/src/database`, i.e. repo root.
  - Scripts under `apps/api` (e.g. token generation) that load dotenv from repo root.
- **Typical contents**
  - `DATABASE_URL`, `REDIS_URL`, etc. pointing to **localhost** (e.g. `postgres://...@localhost:5433/...`, `redis://localhost:6379`).
  - `JWT_SECRET`, `FRONTEND_URL`, SMTP, MinIO, Meilisearch, etc. for local dev.
- **When you use it**
  - Local development: API, workers, and migrations run on your machine and talk to local Postgres/Redis/MinIO/etc.

---

## 2. `infra/docker/.env`

- **Who uses it**
  - **Docker Compose** only. In `infra/docker/docker-compose.yml`, the API service has `env_file: - .env`. Paths in Compose are relative to the compose file, so that is **`infra/docker/.env`**.
  - `./scripts/deploy.sh` (run from repo root) checks for **this** `.env` in `infra/docker/` and copies from `infra/docker/.env.example` if missing.
- **Typical contents**
  - Same variable names as root `.env`, but values for **containers**: e.g. `DATABASE_URL=postgres://postgres:postgres@db:5432/postgres`, `REDIS_URL=redis://redis:6379`, `MINIO_ENDPOINT=minio`, `OLLAMA_HOST=http://ollama:11434`.
  - `JWT_SECRET`, `CITE_ADMIN_SECRET`, `FRONTEND_URL`, SMTP, etc. for the API running inside Docker.
- **When you use it**
  - When you run the stack with Docker (`./scripts/deploy.sh` or `docker compose up` from `infra/docker`). **Do not** point this file at `localhost` for DB/Redis/MinIO; use service names (`db`, `redis`, `minio`, etc.).

So:
- **Root `.env`** = “I’m running API and services on my machine.”
- **`infra/docker/.env`** = “I’m running API and services in Docker; Compose uses this file.”

---

## 3. `apps/mobile/.env`

- **Who uses it**
  - **Expo** / React Native. Expo loads `.env` from the **app root** (`apps/mobile`). Only variables prefixed with `EXPO_PUBLIC_` are exposed to the client (e.g. `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_WEB_BASE_URL`).
- **When you use it**
  - Running the mobile app (Expo). Use it to point the app at your API (localhost for dev, or your deployed API URL).

---

## 4. `apps/web/.env` or `.env.local` (optional)

- **Who uses it**
  - **Next.js** loads `.env`, `.env.local`, `.env.development`, `.env.production` from the **app root** (`apps/web`). No path in the repo points at the repo root for the web app.
- **Typical contents**
  - `NEXT_PUBLIC_API_URL`, `API_URL` (for server-side routes), `DEV_TOKEN` if used.
- **When you use it**
  - Running the web app from `apps/web`. If you don’t have `apps/web/.env`, Next falls back to defaults in code (e.g. `http://localhost:3000` for API).

---

## Summary

- **Local dev (API + DB + Redis + … on your machine):**  
  Use **root `.env`** with localhost URLs. API and migrations read it.
- **Docker (API + stack in containers):**  
  Use **`infra/docker/.env`** with Docker service hostnames. Only Compose uses it; root `.env` is not used by the API inside Docker.
- **Mobile:**  
  Use **`apps/mobile/.env`** for `EXPO_PUBLIC_*` (API URL, etc.).
- **Web:**  
  Use **`apps/web/.env`** (or `.env.local`) if you need to override API URL or other Next env vars.

You have “many” `.env` files because each context (local API, Docker, mobile, web) has its own working directory and its own env file. Keeping them separate avoids mixing localhost and Docker hostnames and keeps secrets per environment.
