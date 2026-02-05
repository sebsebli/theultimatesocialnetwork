import { useEffect } from "react";
import { useRouter } from "expo-router";
import { getOnboardingStage } from "../../utils/api";
import { View } from "react-native";
import { FullScreenSkeleton } from "../../components/LoadingSkeleton";

/**
 * Entry point for onboarding: redirects to the correct step so users
 * resume where they left off if they closed the app mid-flow.
 */
export default function OnboardingIndexScreen() {
  const router = useRouter();

  useEffect(() => {
    getOnboardingStage().then((stage) => {
      const route =
        stage === "profile"
          ? "/onboarding/profile"
          : stage === "starter-packs"
            ? "/onboarding/starter-packs"
            : "/onboarding/languages";
      router.replace(route as any);
    });
  }, [router]);

  return <FullScreenSkeleton />;
}
