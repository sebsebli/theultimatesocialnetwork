/**
 * Central error reporting for production. In development logs to console.
 * To enable Sentry: set window.__reportError = (err, ctx) => Sentry.captureException(err, { extra: ctx })
 * in a client entry or layout, or install @sentry/nextjs and call Sentry.captureException here.
 */
export function reportError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[reportError]", error, context ?? "");
    return;
  }
  const win = typeof window !== "undefined" ? window : undefined;
  const capture = (
    win as {
      __reportError?: (err: unknown, ctx?: Record<string, unknown>) => void;
    }
  )?.__reportError;
  if (capture) {
    try {
      capture(error, context);
    } catch (e) {
      console.error("[reportError] capture failed", e);
    }
  }
}
