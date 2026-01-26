/**
 * Security utilities for mobile app
 */

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 10000); // Max length
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

// Validate handle
export const isValidHandle = (handle: string): boolean => {
  if (!handle || typeof handle !== 'string') return false;
  // 3-30 chars, lowercase alphanumeric + underscore only, no spaces
  const handleRegex = /^[a-z0-9_]{3,30}$/;
  return handleRegex.test(handle);
};

// Validate URL
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Rate limiting helper (client-side, basic)
let requestTimestamps: number[] = [];
const MAX_REQUESTS = 10;
const WINDOW_MS = 60000; // 1 minute

export const checkRateLimit = (): boolean => {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(ts => now - ts < WINDOW_MS);
  
  if (requestTimestamps.length >= MAX_REQUESTS) {
    return false;
  }
  
  requestTimestamps.push(now);
  return true;
};

// XSS protection for user-generated content
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
