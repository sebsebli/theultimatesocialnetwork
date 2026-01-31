# Backend Security Audit (Pentest Summary)

This document summarizes a security review of the Citewalk API backend: authentication, rate limiting, input validation, and common attack vectors (DDoS, injection, path traversal, info disclosure).

---

## Executive Summary

The backend has **solid baseline protections**: global rate limiting (Redis-backed), Helmet security headers, CORS allowlist, global validation (whitelist + forbidNonWhitelisted), JWT auth on sensitive routes, and HTML sanitization (DOMPurify) for post content. Several **gaps were identified and fixed** (see “Fixes Applied”). Remaining **recommendations** are listed for hardening.

---

## What’s Already in Place

### Authentication & Authorization

- **JWT** via `passport-jwt`; Bearer token in `Authorization` header.
- **Guards**: `AuthGuard('jwt')` on protected routes; `OptionalJwtAuthGuard` where auth is optional; `AdminKeyGuard` (X-Admin-Key) for admin endpoints.
- **Admin routes**: Require `CITE_ADMIN_SECRET`; in production, default `dev-admin-change-me` is rejected.
- **JWT errors**: Mapped to 401 (no 500 leakage) via `AllExceptionsFilter`; stack traces hidden in production.

### Rate Limiting (DDoS / Abuse)

- **Global**: `ThrottlerGuard` with Redis storage — **100 requests / 60s per IP** (configurable in `app.module.ts`).
- **Stricter per-route**:
  - Auth: login 5/min, verify 10/min.
  - Posts: 10/min (create, quote).
  - RSS: 20/min (public endpoint).
- **Waiting-list**: 5/min per IP (added in this audit).
- **Health**: 60/min per IP (added in this audit; enough for load balancer checks).

### Input Validation & Sanitization

- **Global `ValidationPipe`**: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — strips unknown properties and rejects invalid payloads.
- **DTOs**: `class-validator` on auth, posts, collections, reports, push, etc.
- **Post body**: DOMPurify sanitization before save; topic/mention parsing on sanitized content.
- **User updates**: Controller whitelists allowed fields to prevent arbitrary entity updates.
- **Export data**: Sanitized (IDs removed) before download.

### Security Headers & CORS

- **Helmet**: CSP, XSS-related headers; COEP/COEP tuned for API and image embedding.
- **CORS**: Explicit origin list via `CORS_ORIGINS`; in dev, `exp://` allowed for Expo; credentials and methods/headers restricted.

### Data Layer

- **SQL**: Raw queries use **parameterized** placeholders (`$1`, `$2`, …); no string concatenation of user input into SQL.
- **ORM**: TypeORM repositories and QueryBuilder used with parameters; no raw user input in query strings.

### Error Handling & Logging

- **AllExceptionsFilter**: Consistent error JSON; trace ID; no internal details in production response.
- **Logging**: Pino; production logs structured (no stack in client response).

### Other

- **Swagger**: Enabled only when `NODE_ENV !== 'production'`.
- **RSS**: Valid RSS 2.0 XML; short-lived cache (5 min); rate limited; `Content-Type: application/rss+xml`.

---

## Fixes Applied (This Audit)

1. **Waiting-list POST** — Previously unthrottled; could be used to flood DB or emails. **Fix**: `@Throttle({ limit: 5, ttl: 60000 })` on `WaitingListController`.
2. **Health GET** — Public and unthrottled; usable for reconnaissance. **Fix**: `@Throttle({ limit: 60, ttl: 60000 })` on `HealthController` (still allows normal LB health checks).
3. **Images GET** — Key taken from URL and passed to MinIO; path traversal risk (e.g. `..` in key). **Fix**: Reject keys that are empty or contain `..` before calling `getImageStream`.

---

## Recommendations Implemented (Follow-up)

1. **JWT_SECRET in production** — In production, startup now **fails** when `JWT_SECRET` is missing or equals the default `your-secret-key-change-in-production` (AuthModule `JwtModule` useFactory). Tokens cannot be forged with a default secret.

2. **Metrics endpoint** — When **`METRICS_SECRET`** is set in the environment, `GET /metrics` requires either header **`X-Metrics-Secret: <value>`** or **`Authorization: Bearer <value>`**. Prometheus can be configured with the secret; leave unset in dev for open access.

3. **Waiting-list body validation** — **`JoinWaitingListDto`** with `@IsEmail()` and `@MaxLength(255)` is used; invalid or oversized payloads are rejected by the global ValidationPipe. Email is trimmed before storage.

---

## Recommendations (Not Yet Implemented)

1. **Health endpoint scope** — Health returns DB/Redis status. If your deployment allows, consider serving detailed health only from an internal network or VPN, and expose a minimal public health for external load balancers.

2. **Optional: Stricter global limit** — Global 100 req/min per IP may be high for strict DDoS mitigation. Tune in `app.module.ts` (e.g. 60/min) if you observe abuse.

3. **HTTPS** — Enforce TLS in production (reverse proxy or app-level) so tokens and admin keys are not sent in cleartext.

---

## Public vs Protected Endpoints (Summary)

| Endpoint type              | Auth        | Rate limit        |
|---------------------------|------------|-------------------|
| `POST /auth/login`, verify| No         | 5/min, 10/min     |
| `POST /auth/logout`       | No (token) | Global            |
| `GET /health`             | No         | 60/min            |
| `GET /rss/:handle`        | No         | 20/min            |
| `POST /waiting-list`     | No         | 5/min             |
| `GET /images/*`          | No         | Global + path check |
| `GET /metrics`            | Optional (X-Metrics-Secret or Bearer when `METRICS_SECRET` set) | Global            |
| Feed, posts, users, etc.  | JWT or optional | Global + route-specific |
| Admin (invites, etc.)     | X-Admin-Key| Global            |

---

## Attack Vectors Considered

- **DDoS / brute force**: Mitigated by global and per-route throttling (Redis).
- **SQL injection**: Mitigated by parameterized queries and ORM usage.
- **XSS**: Mitigated by DOMPurify on post body and safe serialization.
- **Path traversal**: Mitigated by rejecting `..` in image keys.
- **Mass assignment**: Mitigated by ValidationPipe whitelist and controller field whitelist.
- **Info disclosure**: Mitigated by generic 500 messages and no stack in production; health/metrics exposure noted above.
- **Auth bypass**: Mitigated by guards on sensitive routes; admin routes require separate secret.

---

*Last updated: 2025-01-31 (post-audit fixes; JWT fail-fast, metrics protection, waiting-list DTO).*
