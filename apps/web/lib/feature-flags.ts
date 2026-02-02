/**
 * Feature flags for home/overlay copy and CTAs.
 *
 * Beta mode (invitation-only) is NOT read from env here. It comes from the
 * real API: GET /api/invites/beta-mode (backend system_settings BETA_MODE).
 * Use the useBetaMode() hook from @/context/beta-mode-provider in client
 * components so all beta-mode checks use the same source of truth.
 */
