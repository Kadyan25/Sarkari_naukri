"use client";
import Link from "next/link";
import { Job } from "@/lib/types";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/lib/i18n";
import JobCard from "./JobCard";
import CategoryTabs from "./CategoryTabs";

interface Props {
  jobs: Job[];
  error: boolean;
  category: string;
  page: number;
}

export default function HomeContent({ jobs, error, category, page }: Props) {
  const { lang } = useApp();
  const t = useT(lang);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="bg-gradient-to-r from-brand to-brand-dark rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-lg sm:text-2xl font-bold leading-tight">
          {t("heroTitle")}
        </h1>
        <p className="text-blue-100 text-sm mt-1">{t("heroSub")}</p>
        <a
          href="https://t.me/your_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 bg-white text-brand
                     px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
        >
          🔔 {t("telegramCta")}
        </a>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t("freshJobs"),   value: "500+" },
          { label: t("dailyUpdate"), value: "24/7" },
          { label: "Telegram",       value: "10K+" },
        ].map((stat) => (
          <div key={stat.label} className="card text-center py-3">
            <div className="text-lg font-bold text-brand">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Category Tabs */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {t("pickDept")}
        </h2>
        <CategoryTabs active={category} />
      </section>

      {/* Jobs List */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">
            {category
              ? `${category.toUpperCase()} ${t("recruitments")}`
              : t("latestJobs")}
          </h2>
          {jobs.length > 0 && (
            <span className="text-xs text-gray-400">{jobs.length} jobs</span>
          )}
        </div>

        {error && (
          <div className="card text-center py-8 text-red-500">{t("loadError")}</div>
        )}
        {!error && jobs.length === 0 && (
          <div className="card text-center py-8 text-gray-400">{t("noJobs")}</div>
        )}

        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {jobs.length === 20 && (
          <div className="flex justify-center mt-6 gap-3">
            {page > 1 && (
              <Link href={`/?category=${category}&page=${page - 1}`} className="btn-primary">
                {t("prev")}
              </Link>
            )}
            <Link href={`/?category=${category}&page=${page + 1}`} className="btn-primary">
              {t("next")}
            </Link>
          </div>
        )}
      </section>

      {/* SEO Text */}
      <section className="card mt-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {t("aboutTitle")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {t("aboutText")}
        </p>
      </section>
    </div>
  );
}
