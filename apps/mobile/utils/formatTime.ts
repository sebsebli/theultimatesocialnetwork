import i18next from "i18next";

/**
 * Relative time formatter — shared across PostContent, comments, messages, etc.
 * Uses i18next for translations when available.
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diff = now - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const t = i18next.t.bind(i18next);

  if (minutes < 1) return t("common.time.now", "now");
  if (minutes < 60) return `${minutes}${t("common.time.minutes", "m")}`;
  if (hours < 24) return `${hours}${t("common.time.hours", "h")}`;
  if (days < 7) return `${days}${t("common.time.days", "d")}`;
  return d.toLocaleDateString();
}
