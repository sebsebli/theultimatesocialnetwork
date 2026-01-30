# Production Readiness Checklist

Use this checklist before deploying to production.

## Environment & Secrets

- [ ] **API**: Set `JWT_SECRET` to a long, random value (never use the default).
- [ ] **API**: Set `CITE_ADMIN_SECRET` for invite generation; do not use `dev-admin-change-me` in production (admin-key guard will reject it).
- [ ] **API**: Set `CORS_ORIGINS` to your frontend and mobile origins (e.g. `https://cite.app,https://api.cite.app`). If unset, only localhost origins are allowed.
- [ ] **API**: Configure `MINIO_PUBLIC_URL` (or equivalent) so image URLs in API responses point to your production storage (not `http://localhost:9000`).
- [ ] **Web**: Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_STORAGE_URL` (and `API_URL` for server-side). Use HTTPS.
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
- Web image URLs use `NEXT_PUBLIC_STORAGE_URL` (no hardcoded localhost in production when env is set).

## Optional

- Replace `console.warn` in auth/offline/api with a logging service if you need structured logs.
- Run E2E or smoke tests against a staging environment before production deploy.
