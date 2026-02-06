"use client";

import Link from "next/link";
import { useBetaMode } from "@/context/beta-mode-provider";

interface ManifestoCtaProps {
  isAuthenticated?: boolean;
}

export function ManifestoCta({ isAuthenticated }: ManifestoCtaProps) {
  const { betaMode } = useBetaMode();

  const href = isAuthenticated
    ? "/home"
    : betaMode
      ? "/waiting-list"
      : "/sign-in";

  const label = isAuthenticated ? "Open Citewalk" : "Get Started";

  return (
    <Link
      href={href}
      className="px-6 py-2.5 bg-[var(--foreground)] text-[var(--background)] font-sans font-bold text-sm hover:bg-white transition-colors rounded"
    >
      {label}
    </Link>
  );
}
