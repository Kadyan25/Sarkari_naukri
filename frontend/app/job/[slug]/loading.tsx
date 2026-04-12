export default function Loading() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-pulse">
      {/* Breadcrumb */}
      <div className="skeleton h-3 w-40" />
      {/* Title card */}
      <div className="card">
        <div className="skeleton h-6 w-3/4 mb-2" />
        <div className="skeleton h-4 w-1/2" />
      </div>
      {/* Details grid */}
      <div className="card">
        <div className="skeleton h-5 w-24 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton h-3 w-20 mb-1" />
              <div className="skeleton h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
      {/* Buttons */}
      <div className="flex gap-3">
        <div className="skeleton h-10 flex-1 rounded-lg" />
        <div className="skeleton h-10 flex-1 rounded-lg" />
      </div>
    </div>
  );
}
