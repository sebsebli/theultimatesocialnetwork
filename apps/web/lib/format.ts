/**
 * Format a number in compact form: 1k, 43k, 5M, 1.2B
 */
export function formatCompactNumber(n: number): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "0";
  if (n >= 1e9) {
    const v = n / 1e9;
    return String(v % 1 === 0 ? v : v.toFixed(1)).replace(/\.0$/, "") + "B";
  }
  if (n >= 1e6) {
    const v = n / 1e6;
    return String(v % 1 === 0 ? v : v.toFixed(1)).replace(/\.0$/, "") + "M";
  }
  if (n >= 1e3) {
    const v = n / 1e3;
    return String(v % 1 === 0 ? v : v.toFixed(1)).replace(/\.0$/, "") + "k";
  }
  return String(n);
}
