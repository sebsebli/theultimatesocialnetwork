/**
 * Input validation utilities for mobile app security
 */

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  // Remove null bytes and trim
  return input.replace(/\0/g, '').trim().slice(0, maxLength);
}

export function validateToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  // Token should be alphanumeric, 4-10 characters
  return /^[a-zA-Z0-9]{4,10}$/.test(token);
}

export function validateUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
