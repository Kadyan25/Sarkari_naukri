import Link from "next/link";
import { Job, CATEGORY_LABELS } from "@/lib/types";
import Countdown from "./Countdown";

export default function JobCard({ job }: { job: Job }) {
  const isExpiringSoon =
    job.last_date
      ? (new Date(job.last_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 7
      : false;

  return (
    // Link gives instant client-side nav + hover prefetch — much faster than <a>
    <Link
      href={`/job/${job.slug}`}
      prefetch={false}   // prefetch on hover only (saves bandwidth on long lists)
      className="card flex flex-col gap-2 hover:shadow-md hover:border-brand-light
                 transition-all duration-150 active:scale-[0.99]"
    >
      {/* Category badge + status */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge badge-${job.category}`}>
          {CATEGORY_LABELS[job.category] ?? job.category.toUpperCase()}
        </span>
        {job.status === "result_out" && (
          <span className="badge bg-green-100 text-green-700">✅ Result Out</span>
        )}
        {job.status === "admit_card" && (
          <span className="badge bg-yellow-100 text-yellow-700">🎫 Admit Card</span>
        )}
        {isExpiringSoon && job.status === "active" && (
          <span className="badge bg-red-100 text-red-700">⚠️ Closing Soon</span>
        )}
      </div>

      {/* Title */}
      <h2 className="font-semibold text-sm sm:text-base text-gray-900 leading-snug">
        {job.title}
      </h2>
      {job.title_hindi && (
        <p className="hindi text-xs text-gray-500">{job.title_hindi}</p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
        {job.total_posts && (
          <span>📋 <strong>{job.total_posts.toLocaleString("hi-IN")}</strong> पद</span>
        )}
        {job.qualification && (
          <span>🎓 {job.qualification}</span>
        )}
        {job.salary && (
          <span>💰 {job.salary}</span>
        )}
      </div>

      {/* Last date + countdown */}
      {job.last_date && (
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            अंतिम तिथि:{" "}
            <strong className={isExpiringSoon ? "text-red-600" : "text-gray-700"}>
              {new Date(job.last_date).toLocaleDateString("hi-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </strong>
          </span>
          <Countdown lastDate={job.last_date} />
        </div>
      )}
    </Link>
  );
}
