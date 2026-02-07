"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STAGE_KEY = "onboarding_stage";
type Stage = "languages" | "topics" | "profile" | "starter-packs";

/**
 * Entry point for onboarding: redirect to the correct step so users
 * resume where they left off (same as mobile).
 */
export default function OnboardingIndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof sessionStorage === "undefined") {
      router.replace("/onboarding/languages");
      return;
    }
    const complete = sessionStorage.getItem("onboarding_complete");
    if (complete === "true") {
      router.replace("/home");
      return;
    }
    const stage = sessionStorage.getItem(STAGE_KEY) as Stage | null;

    const route =
      stage === "topics"
        ? "/onboarding/topics"
        : stage === "profile"
          ? "/onboarding/profile"
          : stage === "starter-packs"
            ? "/onboarding/starter-packs"
            : "/onboarding/languages";

    router.replace(route);
  }, [router]);

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="animate-pulse text-secondary">Loading…</div>
    </div>
  );
}
