import { ExploreSkeleton } from "@/components/skeletons";

export default function ExploreLoading() {
  return (
    <>
      <div className="px-4 md:px-6 py-3 sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-divider">
        <div className="h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl flex items-center">
          <div className="w-full h-4 bg-white/5 rounded animate-pulse max-w-[200px]" />
        </div>
      </div>
      <div className="pt-1 pb-3 border-b border-divider">
        <div className="flex px-4 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-20 h-4 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
      <ExploreSkeleton />
    </>
  );
}
