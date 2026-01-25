/**
 * Security utilities for production
 */

/**
 * Get API URL with HTTPS enforcement in production
 */
export function getApiUrl(): string {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // In production, enforce HTTPS
  if (process.env.NODE_ENV === 'production' && process.env.SKIP_HTTPS_CHECK !== 'true') {
    if (!apiUrl.startsWith('https://')) {
      throw new Error('API_URL must use HTTPS in production');
    }
  }
  
  return apiUrl;
}

/**
 * Secure error response - don't leak sensitive information
 */
export function createSecureErrorResponse(message: string, status: number = 500) {
  // In production, use generic messages
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && status >= 500) {
    return {
      error: 'Internal server error',
      status,
    };
  }
  
  return {
    error: message,
    status,
  };
}

/**
 * Validate request origin (basic CSRF protection)
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // In production, validate against allowed origins
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (origin && allowedOrigins.length > 0) {
      return allowedOrigins.includes(origin);
    }
    // If no origin header (same-origin request), allow
    if (!origin) return true;
  }
  
  // In development, allow all
  return true;
}
