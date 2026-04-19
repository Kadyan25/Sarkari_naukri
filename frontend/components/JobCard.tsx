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

  const title      = lang === "hi" && job.title_hindi ? job.title_hindi : job.title;
  const postsLabel = lang === "hi" ? "पद"         : "Posts";
  const lastDLabel = lang === "hi" ? "अंतिम तिथि" : "Last Date";

  return (
    <Link
      href={`/job/${job.slug}`}
      prefetch={false}
      className="card block"
      style={{ transition: "border-color 120ms" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--border-strong)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
    >
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className={`badge badge-${job.category}`}>{catLabel}</span>
        {job.status === "result_out" && (
          <span className="badge" style={{ background: "#dcfce7", color: "#166534" }}>
            ✓ Result Out
          </span>
        )}
        {job.status === "admit_card" && (
          <span className="badge" style={{ background: "#fef9c3", color: "#854d0e" }}>
            Admit Card
          </span>
        )}
        {isExpiringSoon && job.status === "active" && (
          <span className="badge" style={{ background: "#fee2e2", color: "#991b1b" }}>
            ⚠ Closing Soon
          </span>
        )}
      </div>

      {/* Title */}
      <h2
        className="hindi leading-snug mb-1"
        style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink-900)" }}
      >
        {title}
      </h2>
      {lang === "hi" && job.title_hindi && (
        <p style={{ fontSize: "0.75rem", color: "var(--ink-400)" }}>{job.title}</p>
      )}

      {/* Monospace meta row */}
      <div
        className="flex flex-wrap gap-x-4 gap-y-1 mt-2"
        style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--ink-600)" }}
      >
        {job.total_posts && (
          <span>
            <strong style={{ color: "var(--brand-blue)" }}>
              {job.total_posts.toLocaleString("en-IN")}
            </strong>{" "}
            {postsLabel}
          </span>
        )}
        {job.qualification && <span>{job.qualification}</span>}
        {job.salary        && <span>{job.salary}</span>}
      </div>

      {/* Last date + countdown */}
      {job.last_date && (
        <div
          className="flex items-center justify-between mt-2 pt-2"
          style={{ borderTop: "1px solid var(--border-soft)" }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: isExpiringSoon ? "var(--red)" : "var(--ink-600)",
            }}
          >
            {lastDLabel}:{" "}
            <strong>
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
