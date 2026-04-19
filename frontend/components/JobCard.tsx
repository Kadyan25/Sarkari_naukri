"use client";
import Link from "next/link";
import { Job, CATEGORY_LABELS, CATEGORY_HINDI } from "@/lib/types";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/lib/i18n";
import Countdown from "./Countdown";

export default function JobCard({ job }: { job: Job }) {
  const { lang } = useApp();
  const t = useT(lang);

  const isExpiringSoon =
    job.last_date
      ? (new Date(job.last_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 7
      : false;

  const catLabel =
    lang === "hi"
      ? (CATEGORY_HINDI[job.category] ?? job.category.toUpperCase())
      : (CATEGORY_LABELS[job.category] ?? job.category.toUpperCase());

  const title = lang === "hi" && job.title_hindi ? job.title_hindi : job.title;

  return (
    <Link
      href={`/job/${job.slug}`}
      prefetch={false}
      className="card flex flex-col gap-2 hover:shadow-md hover:border-brand-light
                 transition-all duration-150 active:scale-[0.99] block"
    >
      {/* Category badge + status */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge badge-${job.category}`}>{catLabel}</span>
        {job.status === "result_out" && (
          <span className="badge bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
            ✅ Result Out
          </span>
        )}
        {job.status === "admit_card" && (
          <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
            🎫 Admit Card
          </span>
        )}
        {isExpiringSoon && job.status === "active" && (
          <span className="badge bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
            ⚠️ Closing Soon
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-snug">
        {title}
      </h2>
      {/* Show English subtitle when Hindi title is shown */}
      {lang === "hi" && job.title_hindi && (
        <p className="text-xs text-gray-400 dark:text-gray-500">{job.title}</p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mt-1">
        {job.total_posts && (
          <span>
            📋 <strong>{job.total_posts.toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}</strong>{" "}
            {t("posts")}
          </span>
        )}
        {job.qualification && <span>🎓 {job.qualification}</span>}
        {job.salary        && <span>💰 {job.salary}</span>}
      </div>

      {/* Last date + countdown */}
      {job.last_date && (
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t("lastDate")}:{" "}
            <strong className={isExpiringSoon ? "text-red-600" : "text-gray-700 dark:text-gray-300"}>
              {new Date(job.last_date).toLocaleDateString(
                lang === "hi" ? "hi-IN" : "en-IN",
                { day: "numeric", month: "short", year: "numeric" }
              )}
            </strong>
          </span>
          <Countdown lastDate={job.last_date} />
        </div>
      )}
    </Link>
  );
}
