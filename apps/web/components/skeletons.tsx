export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded ${className}`} />
  );
}

export function PostSkeleton() {
  return (
    <div className="p-5 border-b border-divider">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="w-32 h-4 mb-2" />
          <Skeleton className="w-20 h-3" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-3/4 h-4" />
      </div>
      <div className="flex items-center gap-6">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="w-5 h-5" />
        <Skeleton className="w-5 h-5" />
        <Skeleton className="w-5 h-5" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="w-full">
      {/* Header Image / Space */}
      <div className="h-32 bg-white/5" />
      
      <div className="px-6 relative">
        {/* Avatar */}
        <div className="absolute -top-16 left-6">
          <Skeleton className="w-32 h-32 rounded-full border-4 border-ink" />
        </div>
        
        {/* Actions */}
        <div className="flex justify-end pt-4 pb-8">
          <Skeleton className="w-24 h-10 rounded-full" />
        </div>

        {/* Info */}
        <div className="space-y-4 mb-8">
          <div>
            <Skeleton className="w-48 h-8 mb-2" />
            <Skeleton className="w-32 h-4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-full max-w-md h-4" />
            <Skeleton className="w-3/4 max-w-md h-4" />
          </div>
          <div className="flex gap-6 pt-2">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-20 h-4" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-divider pb-4">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
      </div>
    </div>
  );
}
