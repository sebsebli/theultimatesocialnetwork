# Monitoring & Error Tracking (Web)

The web app is ready to integrate with a production error-tracking service (e.g. Sentry).

## How reporting works

- **`lib/error-reporting.ts`** — Central `reportError(error, context?)` helper.
  - In **development**: logs to `console.error` only.
  - In **production**: calls `window.__reportError(error, context)` if set; otherwise no-op.

- **Where errors are reported**
  - `app/error.tsx` — Route-level errors (e.g. failed data loading).
  - `app/global-error.tsx` — Root layout crashes.
  - `components/error-boundary.tsx` — React component tree errors (`componentDidCatch`).

## Enabling Sentry

1. Install Sentry for Next.js:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
   This adds `@sentry/nextjs`, creates `sentry.client.config.ts` / `sentry.server.config.ts`, and wires the SDK.

2. In your client entry (e.g. `sentry.client.config.ts` or the root layout client wrapper), set the hook so all existing `reportError` call sites send to Sentry:
   ```ts
   import * as Sentry from "@sentry/nextjs";

   if (typeof window !== "undefined") {
     (window as unknown as { __reportError?: (err: unknown, ctx?: Record<string, unknown>) => void }).__reportError = (err, ctx) => {
       Sentry.captureException(err, { extra: ctx });
     };
   }
   ```

3. Alternatively, you can replace the body of `reportError` in `lib/error-reporting.ts` to call `Sentry.captureException` directly when `@sentry/nextjs` is installed (and guard with `typeof Sentry !== 'undefined'` if you want to keep the package optional).

## Environment

- Set `SENTRY_DSN` (and optionally auth token) in production so the Sentry SDK can send events.
- No code changes are required for development; errors continue to log to the console.
