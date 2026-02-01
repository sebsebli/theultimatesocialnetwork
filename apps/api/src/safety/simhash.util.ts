/**
 * 64-bit SimHash for fast near-duplicate detection (no network, no embeddings).
 * Used to catch copy-paste / near-identical spam before embedding or LLM.
 */

const FNV_OFFSET_64 = 0xcbf29ce484222325n;
const FNV_PRIME_64 = 0x100000001b3n;

function fnv1a64(str: string): bigint {
  let h = FNV_OFFSET_64;
  for (let i = 0; i < str.length; i++) {
    h ^= BigInt(str.charCodeAt(i));
    h = (h * FNV_PRIME_64) & 0xffffffffffffffffn;
  }
  return h;
}

/** 3-gram shingles (overlapping) for normalized text. */
function shingle3(text: string): string[] {
  const out: string[] = [];
  const n = text.length;
  for (let i = 0; i <= n - 3; i++) {
    out.push(text.slice(i, i + 3));
  }
  return out;
}

/** Compute 64-bit SimHash. Deterministic, fast, in-process. */
export function simhash64(text: string): bigint {
  const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
  if (normalized.length < 3) return 0n;
  const shingles = shingle3(normalized);
  const bits = new Int32Array(64);
  for (const s of shingles) {
    const h = fnv1a64(s);
    for (let i = 0; i < 64; i++) {
      bits[i] += (h & (1n << BigInt(i))) !== 0n ? 1 : -1;
    }
  }
  let out = 0n;
  for (let i = 0; i < 64; i++) {
    if (bits[i] > 0) out |= 1n << BigInt(i);
  }
  return out;
}

/** Hamming distance (number of differing bits). */
export function hammingDistance(a: bigint, b: bigint): number {
  let x = a ^ b;
  let n = 0;
  while (x !== 0n) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}

/** Serialize for Redis (compact string). */
export function simhashToString(h: bigint): string {
  return h.toString(36);
}

export function simhashFromString(s: string): bigint {
  return BigInt(parseInt(s, 36));
}
