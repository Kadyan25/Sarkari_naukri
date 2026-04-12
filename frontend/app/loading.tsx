import JobCardSkeleton from "@/components/JobCardSkeleton";

// Shown immediately while the homepage server component fetches data
export default function Loading() {
  return (
    <div className="space-y-4">
      {/* Hero skeleton */}
      <div className="skeleton rounded-2xl h-28 w-full" />

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card py-3 animate-pulse">
            <div className="skeleton h-5 w-10 mx-auto mb-1" />
            <div className="skeleton h-3 w-14 mx-auto" />
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-7 w-16 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Job cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
