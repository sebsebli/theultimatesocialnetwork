# Auth contract: Web and App (shared process)

Web and mobile must use the **same API contract** and mirror the same steps for login, verify, token storage, and authenticated requests.

## API contract (backend)

### Login

- **Request:** `POST /auth/login`  
  Body: `{ email: string, inviteCode?: string, lang?: string }`
- **Response:** `200` `{ success: true, message?: string }`  
  Sends a 6-digit verification code by email. No token yet.

### Verify

- **Request:** `POST /auth/verify`  
  Body: `{ email: string, token: string }` (token = 6-digit code from email)
- **Response:** `200`  
  Body: `{ accessToken: string, user: { id, email, handle, displayName } }`  
  `accessToken` is a JWT. Clients must store it and send it on every authenticated request.

### Authenticated “current user”

- **Request:** `GET /users/me`  
  Header: `Authorization: Bearer <accessToken>`
- **Response:** `200` user object, or `401` if token missing/invalid.

### Logout

- **Request:** `POST /auth/logout`  
  No body required. Backend is stateless; clients clear stored token locally.

---

## Web (Next.js)

| Step       | Action                                                                 | Token storage                         |
|-----------|------------------------------------------------------------------------|----------------------------------------|
| Login     | `POST /api/auth/login` → proxies to API `POST /auth/login`             | None                                   |
| Verify    | `POST /api/auth/verify` with `{ email, token }` → proxy to API verify  | **httpOnly cookie** `token` = `accessToken` |
| Auth check| `GET /api/me` reads cookie, proxies to API `GET /users/me` with `Authorization: Bearer <token>` | Uses cookie automatically              |
| Logout    | `POST /api/auth/logout` → deletes cookie `token`                       | Cookie cleared                         |
| All API   | Next.js API routes read `(await cookies()).get('token')?.value` and add `Authorization: Bearer ${token}` to backend requests. | Same cookie                            |

---

## App (React Native / Expo)

| Step       | Action                                                                 | Token storage                         |
|-----------|------------------------------------------------------------------------|----------------------------------------|
| Login     | `POST <API_URL>/auth/login` with `{ email, inviteCode? }`             | None                                   |
| Verify    | `POST <API_URL>/auth/verify` with `{ email, token }` → `{ accessToken, user }` | **SecureStore** key `jwt` = `accessToken` |
| Auth check| `GET <API_URL>/users/me` with `Authorization: Bearer <token>` (token from `getAuthToken()`) | SecureStore                            |
| Logout    | `clearAuthToken()` (SecureStore delete) + `signOut()`                  | SecureStore cleared                    |
| All API   | `api.get/post/...` in `utils/api.ts` uses `getAuthToken()` and sends `Authorization: Bearer ${token}`. | Same SecureStore                       |

---

## Mirror rules

1. **Same verify contract**  
   Both call the same backend `POST /auth/verify` and expect `{ accessToken, user }`.  
   Web gets it via `/api/auth/verify` (proxy); mobile calls the API directly.

2. **Same “current user” endpoint**  
   Both resolve “am I logged in?” by calling the same backend: `GET /users/me` with `Authorization: Bearer <accessToken>`.  
   Web does it via `GET /api/me` (which reads cookie and proxies to `GET /users/me`); mobile uses `GET /users/me` with token from SecureStore.

3. **Same header**  
   All authenticated requests use: `Authorization: Bearer <accessToken>`.

4. **Storage differs by platform**  
   - Web: httpOnly cookie `token` (safe for browsers, not sent to other origins).  
   - App: SecureStore key `jwt` (safe for mobile).

5. **Logout**  
   Both clear the stored token only; no shared server-side session.

---

## Token lifecycle checks (for tests / QA)

- **After verify (web):** Response of `POST /api/auth/verify` must include `Set-Cookie` with `token=<accessToken>`. Subsequent `GET /api/me` must return 200 and user data.
- **After verify (app):** `getAuthToken()` must return the same string as `accessToken`; `GET /users/me` with that token must return 200 and user data.
- **After logout (web):** `POST /api/auth/logout` then `GET /api/me` must return 401.
- **After logout (app):** `clearAuthToken()` then `GET /users/me` (or any authenticated call) must fail with 401 when no token is sent.

## Automated tests (web)

- `apps/web/tests/auth.spec.ts` (Playwright):
  - `GET /api/me` without token returns 401
  - `POST /api/auth/logout` returns 200 and `{ success: true }`
  - `POST /api/auth/verify` with invalid/empty body returns 400
- Run from repo root: `pnpm exec playwright test tests/auth.spec.ts --project=chromium` (from `apps/web`) or via your existing Playwright config.
