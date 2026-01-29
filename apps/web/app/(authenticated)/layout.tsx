"use client";

import { DesktopSidebar } from "@/components/desktop-sidebar";
import { DesktopRightSidebar } from "@/components/desktop-right-sidebar";
import { Navigation } from "@/components/navigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider relative min-h-screen">
          {children}
          <Navigation />
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}
