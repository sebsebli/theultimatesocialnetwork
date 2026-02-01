import { PostSkeleton } from "@/components/skeletons";

export default function SearchLoading() {
  return (
    <>
      <div className="px-4 md:px-6 py-3 sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-divider">
        <div className="h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl flex items-center">
          <div className="w-full h-4 bg-white/5 rounded animate-pulse max-w-[240px]" />
        </div>
      </div>
      <div className="pt-3 pb-2 border-b border-divider px-4 flex gap-4">
        {["all", "posts", "people", "topics"].map((i) => (
          <div key={i} className="w-14 h-4 bg-white/5 rounded animate-pulse" />
        ))}
      </div>
      <div className="divide-y divide-divider">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </>
  );
}
