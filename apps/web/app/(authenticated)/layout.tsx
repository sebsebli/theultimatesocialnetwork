"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { DesktopRightSidebar } from "@/components/desktop-right-sidebar";
import { Navigation } from "@/components/navigation";
import { UnreadMessagesProvider } from "@/context/unread-messages-context";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: { needsOnboarding?: boolean }) => {
        if (!cancelled) {
          setNeedsOnboarding(data.needsOnboarding === true);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready && needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [ready, needsOnboarding, router]);

  if (!ready || needsOnboarding) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden />
          <span className="text-secondary text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <UnreadMessagesProvider>
      <div className="flex min-h-screen bg-ink min-w-0">
        <DesktopSidebar />
        <main id="main-content" className="flex-1 flex justify-center min-w-0 md:max-w-2xl lg:max-w-4xl xl:max-w-5xl" role="main">
          <div className="w-full border-x border-divider relative min-h-screen pb-20 md:pb-8">
            {children}
            <Navigation />
          </div>
        </main>
        <DesktopRightSidebar />
      </div>
    </UnreadMessagesProvider>
  );
}
