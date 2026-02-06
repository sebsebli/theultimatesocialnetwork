/**
 * AES-256-GCM encryption utilities for sensitive database fields (e.g. 2FA secrets).
 *
 * Requires env var FIELD_ENCRYPTION_KEY — a 64-character hex string (32 bytes).
 * Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Encrypted values are stored as: iv:authTag:ciphertext  (all hex-encoded).
 * If the env var is missing, functions are no-ops (plaintext passthrough) so
 * existing data keeps working until migration is complete.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

let encryptionKey: Buffer | null = null;

function getKey(): Buffer | null {
  if (encryptionKey) return encryptionKey;
  const hex = process.env.FIELD_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) return null;
  encryptionKey = Buffer.from(hex, 'hex');
  return encryptionKey;
}

/** Returns true when a string looks like our encrypted format (iv:tag:ct). */
function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
}

/**
 * Encrypt a plaintext string. Returns encrypted representation or the
 * original string if no key is configured.
 */
export function encryptField(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext; // no-op when key is absent

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Compute an HMAC-SHA256 hash of a value for use as a deterministic lookup key.
 * Returns a hex string. Uses the encryption key as the HMAC secret.
 * If no key is configured, returns a plain SHA-256 hash (less secure but functional).
 */
export function hashForLookup(value: string): string {
  const key = getKey();
  const normalized = value.trim().toLowerCase();
  if (key) {
    return createHmac('sha256', key).update(normalized).digest('hex');
  }
  // Fallback: plain SHA-256 (still useful for indexing, but not keyed)
  return createHmac('sha256', 'citewalk-default-hmac-key')
    .update(normalized)
    .digest('hex');
}

/**
 * Decrypt an encrypted string. If the value doesn't look encrypted (legacy
 * plaintext) it is returned as-is so old rows still work.
 */
export function decryptField(ciphertext: string): string {
  const key = getKey();
  if (!key) return ciphertext; // no-op when key is absent
  if (!isEncrypted(ciphertext)) return ciphertext; // legacy plaintext

  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
