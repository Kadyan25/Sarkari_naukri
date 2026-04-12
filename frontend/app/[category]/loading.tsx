import JobCardSkeleton from "@/components/JobCardSkeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      {/* Breadcrumb skeleton */}
      <div className="skeleton h-3 w-32" />
      {/* Header skeleton */}
      <div className="card animate-pulse">
        <div className="skeleton h-6 w-48 mb-2" />
        <div className="skeleton h-4 w-64" />
      </div>
      {/* Job cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
