import Link from "next/link";
import { Job, CATEGORY_LABELS, CATEGORY_HINDI } from "@/lib/types";
import Countdown from "./Countdown";

interface Props {
  job:  Job;
  lang?: "hi" | "en";
}

export default function JobCard({ job, lang = "hi" }: Props) {
  const isExpiringSoon =
    job.last_date
      ? (new Date(job.last_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 7
      : false;

  const catLabel =
    lang === "hi"
      ? (CATEGORY_HINDI[job.category]  ?? job.category.toUpperCase())
      : (CATEGORY_LABELS[job.category] ?? job.category.toUpperCase());

  const title       = lang === "hi" && job.title_hindi ? job.title_hindi : job.title;
  const postsLabel  = lang === "hi" ? "पद"         : "Posts";
  const lastDLabel  = lang === "hi" ? "अंतिम तिथि" : "Last Date";

  return (
    <Link
      href={`/job/${job.slug}`}
      prefetch={false}
      className="card flex flex-col gap-2 hover:shadow-md hover:border-brand-light
                 transition-all duration-150 active:scale-[0.99] block"
    >
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge badge-${job.category}`}>{catLabel}</span>
        {job.status === "result_out" && (
          <span className="badge bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
            ✓ Result Out
          </span>
        )}
        {job.status === "admit_card" && (
          <span className="badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Admit Card
          </span>
        )}
        {isExpiringSoon && job.status === "active" && (
          <span className="badge bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
            ⚠ Closing Soon
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-snug hindi">
        {title}
      </h2>
      {lang === "hi" && job.title_hindi && (
        <p className="text-xs text-gray-400 dark:text-gray-500">{job.title}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mt-0.5">
        {job.total_posts && (
          <span>
            📋 <strong>{job.total_posts.toLocaleString("en-IN")}</strong> {postsLabel}
          </span>
        )}
        {job.qualification && <span>🎓 {job.qualification}</span>}
        {job.salary        && <span>💰 {job.salary}</span>}
      </div>

      {/* Last date + countdown */}
      {job.last_date && (
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 hindi">
            {lastDLabel}:{" "}
            <strong className={isExpiringSoon ? "text-red-600" : "text-gray-700 dark:text-gray-300"}>
              {new Date(job.last_date).toLocaleDateString(
                lang === "hi" ? "hi-IN" : "en-IN",
                { day: "numeric", month: "short", year: "numeric" }
              )}
            </strong>
          </span>
          <Countdown lastDate={job.last_date} lang={lang} />
        </div>
      )}
    </Link>
  );
}
