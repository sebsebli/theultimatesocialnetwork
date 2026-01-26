import { PostSkeleton } from "@/components/skeletons";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { DesktopRightSidebar } from "@/components/desktop-right-sidebar";
import { ComposeEditor } from "@/components/compose-editor";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider">
          {/* Header Skeleton */}
          <div className="px-4 py-3 border-b border-divider bg-ink/80 backdrop-blur-md sticky top-0 z-10 h-[60px] flex items-center justify-between">
             <div className="w-20 h-6 bg-white/5 rounded animate-pulse" />
             <div className="w-16 h-6 bg-white/5 rounded animate-pulse" />
          </div>
          
          <ComposeEditor />

          <div className="divide-y divide-divider">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}
