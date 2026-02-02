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

/**
 * Throttler guard that skips rate limiting for requests from localhost / same server
 * (testing, admin, demo agents). Other IPs are limited as configured.
 */
@Injectable()
export class TrustedIpThrottlerGuard extends ThrottlerGuard {
  protected override async shouldSkip(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      ip?: string;
      headers?: Record<string, string | string[] | undefined>;
    }>();
    const ip = getClientIp(request);
    if (isTrustedIp(ip)) {
      return true;
    }
    return super.shouldSkip(context);
  }
}
