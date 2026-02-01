# Production readiness

Summary of production-ready behaviour across API, web, mobile, and infra.

## API

- **Health**
  - **GET /health** — Readiness: DB + Redis. Used by Docker HEALTHCHECK and load balancers. Returns 503 if any dependency is down.
  - **GET /health/live** — Liveness: returns 200 immediately (no DB/Redis). Use for Kubernetes livenessProbe.
- **Security**
  - Helmet (CSP, security headers), CORS (explicit origins), compression, global validation pipe (whitelist, forbidNonWhitelisted).
  - Rate limiting (Throttler + Redis); stricter limits on auth, waiting-list, RSS.
  - **CORS_ORIGINS** is **required** when `NODE_ENV=production` (validated at startup).
- **Observability**
  - Pino HTTP logging; structured JSON in production.
  - **GET /metrics** (Prometheus); protected by **METRICS_SECRET** when set.
- **Errors**
  - Global exception filter: no stack or internal details in production responses; trace ID in response.
- **Graceful shutdown**
  - `enableShutdownHooks()` so SIGTERM/SIGINT are handled cleanly.

## Web (Next.js)

- **Error handling**
  - **not-found.tsx** — 404 page with link to home.
  - **error.tsx** — Segment error boundary with “Try again” and “Back to home”.
  - **global-error.tsx** — Root error boundary (renders its own `<html>`/`<body>`).
- **Loading states**
  - **loading.tsx** for home, explore, search, post/[id], user/[handle] — skeletons while data loads (better perceived performance).
- **Security**
  - Headers in `next.config.mjs` (HSTS, X-Frame-Options, etc.).
  - Image `remotePatterns` for API and assets only.

## Mobile (Expo)

- **Environment**
  - `.env` / `.env.example`: **EXPO_PUBLIC_API_BASE_URL** required (no trailing slash). Use HTTPS in production (e.g. `https://api.yourdomain.com`).
- **Production build**
  - Set `EXPO_PUBLIC_API_BASE_URL` to production API before `eas build --profile production` (or in EAS secrets).
  - Ensure app.json / eas.json has correct bundle identifier and version for store submission.

## Infra (Docker)

- **deploy.sh prod**
  - Validates: JWT_SECRET, METRICS_SECRET, CITEWALK_ADMIN_SECRET, **CORS_ORIGINS**, **FRONTEND_URL** (HTTPS).
  - SSL via Certbot when certs missing; optional auto-renewal cron.
  - Migrations run on deploy.
- **README-PRODUCTION.md**
  - Env table, SSL, MinIO, health endpoints, checklist.

## Checklist before going live

1. **infra/docker**
   - [ ] `.env` has all required production values (see README-PRODUCTION.md).
   - [ ] CORS_ORIGINS and FRONTEND_URL set; FRONTEND_URL is HTTPS.
   - [ ] SSL certs in place; `./deploy.sh prod` succeeds.
2. **API**
   - [ ] CORS_ORIGINS is set in production (API will not start without it).
   - [ ] METRICS_SECRET set if you scrape /metrics.
3. **Web**
   - [ ] NEXT_PUBLIC_API_URL points to production API (HTTPS).
4. **Mobile**
   - [ ] EXPO_PUBLIC_API_BASE_URL points to production API (HTTPS) in release builds.

5. **Dependencies**
   - [ ] Web: `npm audit` in apps/web (Next.js 16.1.6+; 0 vulnerabilities as of last check).
   - [ ] API: Run `npm audit` in apps/api; many reported issues are in dev/build deps (eslint, glob, @nestjs/cli). Address production runtime vulnerabilities; avoid `npm audit fix --force` without testing.
