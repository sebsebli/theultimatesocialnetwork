/**
 * Security utilities for production
 */

/**
 * Get API URL with HTTPS enforcement in production
 */
export function getApiUrl(): string {
  const apiUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";

  // In production (but not in Docker/development), enforce HTTPS
  // Allow HTTP for Docker/local development
  const isDocker =
    process.env.DOCKER === "true" ||
    process.env.NEXT_PUBLIC_API_URL?.includes("localhost") ||
    process.env.NEXT_PUBLIC_API_URL?.includes("127.0.0.1") ||
    apiUrl.includes("localhost") ||
    apiUrl.includes("127.0.0.1");
  const isProduction = process.env.NODE_ENV === "production";
  const skipCheck = process.env.SKIP_HTTPS_CHECK === "true";

  if (isProduction && !isDocker && !skipCheck) {
    if (!apiUrl.startsWith("https://")) {
      throw new Error(
        "API_URL must use HTTPS in production (unless in Docker or SKIP_HTTPS_CHECK=true)",
      );
    }
  }

  return apiUrl;
}

/**
 * Build image URL from storage key. Prefer NEXT_PUBLIC_API_URL/images/key when set;
 * otherwise use same-origin /api/images/key proxy so avatars load without client env.
 */
export function getImageUrl(key: string): string {
  if (!key || typeof key !== "string" || !key.trim()) return "";
  const trimmed = key.trim();
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  if (apiBase) {
    return `${apiBase}/images/${encodeURIComponent(trimmed)}`;
  }
  return `/api/images/${encodeURIComponent(trimmed)}`;
}

/**
 * Secure error response - don't leak sensitive information
 */
export function createSecureErrorResponse(
  message: string,
  status: number = 500,
) {
  // In production, use generic messages
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && status >= 500) {
    return {
      error: "Internal server error",
      status,
    };
  }

  return {
    error: message,
    status,
  };
}

/**
 * Validate request origin (CSRF protection).
 * In production: require origin to be missing (same-origin) or listed in ALLOWED_ORIGINS.
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (process.env.NODE_ENV === "production") {
    const allowed = (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    // Same-origin or no origin (e.g. same-site form POST) — allow
    if (!origin) return true;
    // Cross-origin: must be explicitly allowed
    if (allowed.length > 0) return allowed.includes(origin);
    // No ALLOWED_ORIGINS set: reject cross-origin to be safe
    return false;
  }

  return true;
}
