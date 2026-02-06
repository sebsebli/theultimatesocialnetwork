"use client";

import { memo } from "react";
import { getImageUrl } from "@/lib/security";

export type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-lg",
};

export interface AvatarProps {
  /** Storage key for avatar; URL is built via API /images/{key} */
  avatarKey?: string | null;
  /** Pre-built avatar URL (from API response) */
  avatarUrl?: string | null;
  displayName: string;
  handle?: string;
  size?: AvatarSize;
  className?: string;
}

/**
 * Renders user avatar image when avatarKey or avatarUrl is present,
 * otherwise a circle with the first letter of displayName/handle.
 * Uses native <img> so API image URLs work without Next.js image config.
 */
function AvatarInner({
  avatarKey,
  avatarUrl,
  displayName,
  handle,
  size = "md",
  className = "",
}: AvatarProps) {
  const src =
    (avatarUrl && String(avatarUrl).trim()) ||
    (avatarKey ? getImageUrl(avatarKey) : null) ||
    null;
  const initial = (displayName || handle || "?").charAt(0).toUpperCase();
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={displayName || handle || "Avatar"}
        className={`rounded-full object-cover bg-primary/20 shrink-0 ${sizeClass} ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold shrink-0 ${sizeClass} ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

export const Avatar = memo(AvatarInner);
