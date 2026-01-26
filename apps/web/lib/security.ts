/**
 * Security utilities for production
 */

/**
 * Get API URL with HTTPS enforcement in production
 */
export function getApiUrl(): string {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // In production (but not in Docker/development), enforce HTTPS
  // Allow HTTP for Docker/local development
  const isDocker = process.env.DOCKER === 'true' || 
    process.env.NEXT_PUBLIC_API_URL?.includes('localhost') || 
    process.env.NEXT_PUBLIC_API_URL?.includes('127.0.0.1') ||
    apiUrl.includes('localhost') ||
    apiUrl.includes('127.0.0.1');
  const isProduction = process.env.NODE_ENV === 'production';
  const skipCheck = process.env.SKIP_HTTPS_CHECK === 'true';
  
  if (isProduction && !isDocker && !skipCheck) {
    if (!apiUrl.startsWith('https://')) {
      throw new Error('API_URL must use HTTPS in production (unless in Docker or SKIP_HTTPS_CHECK=true)');
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
 * Generate a random secure token
 */
export function generateRandomToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  return result;
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
