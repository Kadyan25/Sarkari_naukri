// Reusable skeleton that matches JobCard dimensions — prevents layout shift
export default function JobCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3 animate-pulse">
      <div className="flex gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="flex gap-4 mt-1">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="border-t border-gray-100 pt-2 flex justify-between">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-3 w-16" />
      </div>
    </div>
  );
}
