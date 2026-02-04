import { type ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Check if IP is localhost or private (same-server / Docker host / internal). */
function isTrustedIp(ip: string | undefined): boolean {
  if (!ip) return false;
  const trimmed = ip.trim();
  if (trimmed === '127.0.0.1' || trimmed === '::1') return true;
  // Docker bridge / private ranges: 10.x, 172.16–31.x, 192.168.x
  if (trimmed.startsWith('10.')) return true;
  if (trimmed.startsWith('192.168.')) return true; // Docker Desktop host, LAN
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(trimmed)) return true; // Docker bridge
  // IPv6 loopback / unique-local
  if (trimmed === '::ffff:127.0.0.1') return true;
  if (trimmed.startsWith('fd') || trimmed.startsWith('fc')) return true;
  return false;
}

/** Get client IP from request (supports X-Forwarded-For / X-Real-IP behind nginx). */
function getClientIp(req: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}): string | undefined {
  const forwarded = req.headers?.['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof first === 'string') return first.split(',')[0].trim();
  const real = req.headers?.['x-real-ip'];
  const realIp = Array.isArray(real) ? real[0] : real;
  if (typeof realIp === 'string') return realIp.trim();
  return req.ip;
}

/** Skip throttle for admin requests (X-Admin-Key) or authenticated requests (Bearer token). */
function isAdminOrAuthenticated(req: {
  headers?: Record<string, string | string[] | undefined>;
}): boolean {
  const adminKey = req.headers?.['x-admin-key'];
  if (adminKey && typeof adminKey === 'string' && adminKey.length > 0)
    return true;
  const auth = req.headers?.[authorization];
  const h = Array.isArray(auth) ? auth[0] : auth;
  if (typeof h === 'string' && h.startsWith('Bearer ')) return true;
  return false;
}
const authorization = 'authorization';

/**
 * Throttler guard that skips rate limiting for:
 * - Non-production (NODE_ENV !== 'production'): always skip — only enforce in production.
 * - Requests from localhost / same server (testing, admin, demo agents).
 * - Admin requests (X-Admin-Key) or authenticated requests (Authorization: Bearer) so agent seed and uploads are not throttled.
 * Other IPs in production are limited as configured.
 */
@Injectable()
export class TrustedIpThrottlerGuard extends ThrottlerGuard {
  protected override async shouldSkip(
    context: ExecutionContext,
  ): Promise<boolean> {
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    const request = context.switchToHttp().getRequest<{
      ip?: string;
      headers?: Record<string, string | string[] | undefined>;
    }>();
    if (isAdminOrAuthenticated(request)) {
      return true;
    }
    const ip = getClientIp(request);
    if (isTrustedIp(ip)) {
      return true;
    }
    return super.shouldSkip(context);
  }
}
