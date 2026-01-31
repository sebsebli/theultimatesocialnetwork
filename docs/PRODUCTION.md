# Production Readiness Checklist

Use this checklist before deploying to production.

**Docker production:** See `infra/docker/README-PRODUCTION.md` for step-by-step setup (`.env`, SSL certs, `./deploy.sh prod`, Prometheus).

## Environment & Secrets

### JWT & metrics (required in production)

- [ ] **JWT_SECRET**: Set to a **strong, non-default value** (e.g. 32+ random bytes). The API **fails startup** in production if `JWT_SECRET` is missing or equals `your-secret-key-change-in-production`. Generate with: `openssl rand -base64 32`.
- [ ] **METRICS_SECRET**: Set in production so `GET /metrics` is protected. When set, scrapers must send either **`X-Metrics-Secret: <value>`** or **`Authorization: Bearer <value>`**. Configure Prometheus (or your scraper) to send this header/token — see `infra/docker/prometheus.example.yml` for a scrape config example.
- [ ] **CITE_ADMIN_SECRET**: Set for invite generation; do not use `dev-admin-change-me` in production (admin-key guard will reject it).
- [ ] **API**: Set `CORS_ORIGINS` to your frontend and mobile origins (e.g. `https://citewalk.app,https://api.citewalk.app`). If unset, only localhost origins are allowed.
- [ ] **API**: Configure `MINIO_PUBLIC_URL` (or equivalent) so image URLs in API responses point to your production storage (not `http://localhost:9000`).
- [ ] **Web**: Set `NEXT_PUBLIC_API_URL` (and `API_URL` for server-side). Use HTTPS.
- [ ] **Mobile**: Set `EXPO_PUBLIC_API_BASE_URL` to your production API URL (HTTPS).
- [ ] Do not commit `.env` or `infra/docker/.env`; they are in `.gitignore`. Use your host’s secret management or CI env.

## Security & CORS

- [ ] API CORS: In production, `CORS_ORIGINS` must list all allowed origins. Expo dev origins are only allowed when `NODE_ENV !== 'production'`.
- [ ] All production URLs should use HTTPS.

## Behaviour & UX (already implemented)

- Onboarding resumes at the correct step after signup or app close.
- Post reading: full-width cover, author above title, home + report in header.
- Profile loading indicator only while loading; error state if load fails.
- Languages: content languages (min 1, max 3); app language follows device.
- Offline storage screen uses `SafeAreaView`; settings accessible from profile.
- Report modal: optional comment and reason selection; report reasons translated.
- Web image URLs use `NEXT_PUBLIC_API_URL` when set (API serves images at `/images/...`); otherwise fallback to local MinIO URL.

## Optional

- Replace `console.warn` in auth/offline/api with a logging service if you need structured logs.
- Run E2E or smoke tests against a staging environment before production deploy.
