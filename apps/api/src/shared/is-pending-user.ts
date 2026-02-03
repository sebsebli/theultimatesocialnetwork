/**
 * Pre-onboarding users have handle starting with __pending_ and displayName "Pending".
 * They must never be shown in public lists, search, feeds, or profile views (except to themselves).
 */
export function isPendingUser(
  user: { handle?: string | null } | null | undefined,
): boolean {
  return !!user?.handle?.startsWith('__pending_');
}
