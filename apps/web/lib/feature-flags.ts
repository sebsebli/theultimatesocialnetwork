/**
 * Feature flags for home/overlay copy and CTAs.
 * Set NEXT_PUBLIC_BETA_ACTIVE=false when opening the beta or going live.
 */

const raw = process.env.NEXT_PUBLIC_BETA_ACTIVE;
export const isBetaActive =
  raw === undefined || raw === "" || raw.toLowerCase() === "true";
