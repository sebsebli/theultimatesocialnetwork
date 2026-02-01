import { PostSkeleton } from "@/components/skeletons";

export default function PostDetailLoading() {
  return (
    <div className="p-4 md:p-6">
      <PostSkeleton />
      <div className="mt-6 space-y-2">
        <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}
