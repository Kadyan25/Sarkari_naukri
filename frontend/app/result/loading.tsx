import JobCardSkeleton from "@/components/JobCardSkeleton";

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="skeleton rounded-xl h-16 w-full" />
      <div className="skeleton h-12 w-full rounded" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <JobCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
