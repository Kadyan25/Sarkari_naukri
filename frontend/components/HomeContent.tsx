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

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Editorial Hero */}
      <div
        style={{
          borderBottom: "2px solid var(--border-strong)",
          paddingBottom: "16px",
          marginBottom: "4px",
        }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-600)",
            marginBottom: "8px",
          }}
        >
          {today} · ताजा भर्ती · Latest Recruitments
        </p>

        <h1
          className="hindi leading-tight"
          style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)", fontWeight: 700, color: "var(--ink-900)" }}
        >
          {t("heroTitle")}
        </h1>
        <p
          className="hindi mt-1"
          style={{ fontSize: "0.875rem", color: "var(--ink-600)" }}
        >
          {t("heroSub")}
        </p>

        <a
          href="https://t.me/your_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center gap-2 mt-3"
        >
          🔔 {t("telegramCta")}
        </a>
      </div>

      {/* StatBar */}
      <div
        className="grid grid-cols-3 gap-0"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          background: "var(--bg-surface)",
        }}
      >
        {[
          { label: t("freshJobs"),   value: "500+" },
          { label: t("dailyUpdate"), value: "24/7" },
          { label: "Telegram",       value: "10K+" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="text-center py-3 px-2"
            style={{
              borderRight: i < 2 ? "1px solid var(--border)" : undefined,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "var(--brand-blue)",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{ fontSize: "0.7rem", color: "var(--ink-600)", marginTop: "2px" }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Category Tabs */}
      <section>
        <p className="eyebrow">{t("pickDept")}</p>
        <CategoryTabs active={category} lang={lang} />
      </section>

      {/* Jobs List */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow" style={{ marginBottom: 0, borderBottom: "none" }}>
            {category
              ? `${category.toUpperCase()} ${t("recruitments")}`
              : t("latestJobs")}
          </p>
          {jobs.length > 0 && (
            <span
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-400)" }}
            >
              {jobs.length} jobs
            </span>
          )}
        </div>

        {error && (
          <div className="card text-center py-8" style={{ color: "var(--red)" }}>
            {t("loadError")}
          </div>
        )}
        {!error && jobs.length === 0 && (
          <div className="card text-center py-8" style={{ color: "var(--ink-400)" }}>
            {t("noJobs")}
          </div>
        )}

        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} lang={lang} />
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
        <p className="eyebrow">{t("aboutTitle")}</p>
        <p className="hindi" style={{ fontSize: "0.875rem", color: "var(--ink-700)", lineHeight: 1.7 }}>
          {t("aboutText")}
        </p>
      </section>
    </div>
  );
}
