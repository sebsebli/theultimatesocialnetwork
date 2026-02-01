# Web app security audit

Summary of the full security audit and fixes applied for production readiness.

## 1. Authentication & session

### Cookie (token)

- **HttpOnly** — Token is set with `httpOnly: true` in `/api/auth/verify`, so it is not readable by JavaScript (mitigates XSS token theft).
- **Secure** — Cookie uses `secure: true` in production.
- **SameSite** — `sameSite: 'lax'` to reduce CSRF risk while allowing top-level navigation.
- **Path** — `path: '/'` so the cookie is sent for all app routes.
- **No client-side token** — Code that read `document.cookie` to get the token was removed; with HttpOnly, the token is never in `document.cookie`. All authenticated requests go through the BFF with `credentials: 'include'` so the browser sends the cookie automatically.

### Fixes applied

- **post-detail.tsx** — Stopped calling the backend directly with a token from `document.cookie`. Like/keep now call `/api/posts/[id]/like` and `/api/posts/[id]/keep` with `credentials: 'include'`. Removed view/read-time client calls that relied on the same broken pattern.
- **invites/page.tsx** — Stopped reading `document.cookie` for the token. Fetches `/api/invites/my` and `/api/invites/generate` with `credentials: 'include'` only.
- **BFF routes** — Added `/api/invites/my` (GET) and `/api/invites/generate` (POST) that read the token from cookies server-side and proxy to the backend.

## 2. CSRF & origin

- **validateOrigin** — Login and verify use `validateOrigin(request)`. In production, cross-origin requests are allowed only if the origin is in `ALLOWED_ORIGINS`; if `ALLOWED_ORIGINS` is unset and an origin header is present, the request is rejected.
- **Same-origin BFF** — All state-changing actions go through same-origin API routes; the browser sends the cookie only for same-origin requests (SameSite=lax).

## 3. XSS

- **Markdown rendering** — `renderMarkdown` already escaped `&`, `<`, `>` at the start. Added:
  - **escapeAttr** — For values used in HTML attributes (`data-alias`, `data-targets`): escape `&`, `"`, `'`, `<`, `>`.
  - **escapeText** — For values used as text content: escape `&`, `<`, `>`.
  - Wikilink alias and link text are escaped before insertion. Post IDs in wikilinks are sanitized to `[a-zA-Z0-9-]` for path safety.
- **dangerouslySetInnerHTML** — Only used with output from `renderMarkdown`, which is now consistently escaped/sanitized.

## 4. Headers (next.config.mjs)

- **Strict-Transport-Security** — HSTS with long max-age and preload.
- **X-Frame-Options** — `SAMEORIGIN`.
- **X-Content-Type-Options** — `nosniff`.
- **X-XSS-Protection** — `1; mode=block`.
- **Referrer-Policy** — `strict-origin-when-cross-origin`.
- **Permissions-Policy** — Disables camera, microphone, geolocation, interest-cohort.
- **Content-Security-Policy** — default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'.

## 5. Authorization & routes

- **Middleware** — `/invites` added to `protectedRoutes` so unauthenticated users are redirected to the landing page.
- **API routes** — Authenticated BFF routes read the token from cookies and return 401 when missing; they do not expose the token to the client.

## 6. Sensitive data & errors

- **createSecureErrorResponse** — Used in verify; in production, 5xx responses return a generic message.
- **No token in client** — Token is never sent to the client or logged; it stays in the HttpOnly cookie and is only used server-side in BFF routes.

## 7. Dependencies

- Run **npm audit** regularly. Next.js was upgraded from 16.1.4 to 16.1.6 to address high-severity DoS vulnerabilities (Image Optimizer, PPR Resume, RSC deserialization). Avoid `npm audit fix --force` without testing.

## 8. Production checklist

- [ ] Set **ALLOWED_ORIGINS** in production (comma-separated origins that may send login/verify requests, e.g. `https://yourdomain.com`).
- [ ] Ensure **NEXT_PUBLIC_API_URL** and **API_URL** use HTTPS in production.
- [ ] Do not expose secrets via `NEXT_PUBLIC_*`; only `NEXT_PUBLIC_API_URL` and feature flags are safe.
- [ ] Run `npm audit` and address critical/high vulnerabilities in dependencies.

## Files changed

- `components/post-detail.tsx` — Use BFF for like/keep; remove document.cookie and view/read-time.
- `app/invites/page.tsx` — Use credentials only; map API response (invites/remaining).
- `app/api/invites/my/route.ts` — New BFF for GET invites.
- `app/api/invites/generate/route.ts` — New BFF for POST generate.
- `lib/security.ts` — validateOrigin: in production reject cross-origin when ALLOWED_ORIGINS unset.
- `middleware.ts` — Add /invites to protectedRoutes.
- `next.config.mjs` — Referrer-Policy, Permissions-Policy, Content-Security-Policy.
- `utils/markdown.ts` — escapeAttr, escapeText; escape alias/targets/text; sanitize post ID in wikilinks.
