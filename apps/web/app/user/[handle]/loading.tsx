import { ProfileSkeleton } from "@/components/skeletons";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { DesktopRightSidebar } from "@/components/desktop-right-sidebar";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider">
          <ProfileSkeleton />
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}
