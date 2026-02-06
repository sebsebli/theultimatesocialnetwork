import type { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal } from '../metrics';

/**
 * Express middleware that tracks HTTP request duration and counts.
 * Attaches to every request and records metrics on response finish.
 *
 * Route normalization: uses Express route pattern (e.g. /api/posts/:id)
 * instead of the full URL to keep cardinality manageable.
 */
export function httpMetricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSec = durationNs / 1e9;

    // Prefer Express route pattern; fall back to first two path segments
    const route = (req as { route?: { path?: string } }).route?.path
      ? `${req.baseUrl || ''}${(req as { route: { path: string } }).route.path}`
      : normalizeRoute((req as { path: string }).path);

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestDuration.observe(labels, durationSec);
    httpRequestTotal.inc(labels);
  });

  next();
}

/**
 * Normalize a URL path to reduce cardinality.
 * Replaces UUIDs and numeric IDs with :id placeholder.
 */
function normalizeRoute(path: string): string {
  return path
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id',
    )
    .replace(/\/\d+(?=\/|$)/g, '/:id');
}
