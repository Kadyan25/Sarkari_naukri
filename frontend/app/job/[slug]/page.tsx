import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob, getRecentJobSlugs } from "@/lib/api";
import { Job, CATEGORY_LABELS, CATEGORY_HINDI } from "@/lib/types";
import Countdown from "@/components/Countdown";

export async function generateStaticParams() {
  const slugs = await getRecentJobSlugs(100);
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = true;
export const revalidate = 1800;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function generateJobSchema(job: Job) {
  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: [
      job.title_hindi,
      job.qualification ? `Qualification: ${job.qualification}` : null,
      job.total_posts   ? `Total Posts: ${job.total_posts}` : null,
      job.salary        ? `Salary: ${job.salary}` : null,
    ].filter(Boolean).join(". "),
    datePosted:      job.created_at,
    validThrough:    job.last_date ? `${job.last_date}T23:59:59` : undefined,
    employmentType:  "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name:   "Government of India",
      sameAs: job.official_url ?? "https://india.gov.in",
    },
    jobLocation: {
      "@type":   "Place",
      address: { "@type": "PostalAddress", addressCountry: "IN" },
    },
    ...(job.salary && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "INR",
        value: { "@type": "QuantitativeValue", description: job.salary },
      },
    }),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const job = await getJob(slug);
    const desc = [
      job.title_hindi,
      job.total_posts ? `${job.total_posts} Posts` : null,
      job.last_date
        ? `Last Date: ${new Date(job.last_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
        : null,
      job.qualification ? `Qualification: ${job.qualification}` : null,
    ].filter(Boolean).join(" | ");
    return {
      title: `${job.title} | Sarkari Naukri`,
      description: desc || `Apply for ${job.title}. Check eligibility, last date, vacancy details.`,
      alternates: { canonical: `/job/${job.slug}` },
      openGraph: { title: job.title, description: desc, type: "article" },
    };
  } catch {
    return {};
  }
}

// ── Reusable table row ──────────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: string | number | null;
  highlight?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
      <td
        className="hindi align-top whitespace-nowrap"
        style={{
          padding: "8px 12px 8px 0",
          fontSize: "0.78rem",
          color: "var(--ink-600)",
          width: "9rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </td>
      <td
        className="hindi"
        style={{
          padding: "8px 0",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: highlight ? "var(--red)" : "var(--ink-900)",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2
        className="hindi flex items-center gap-2"
        style={{
          fontWeight: 700,
          fontSize: "0.85rem",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "var(--ink-700)",
          borderBottom: "2px solid var(--border-strong)",
          paddingBottom: "8px",
          marginBottom: "12px",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span>{icon}</span>
        <span>{title}</span>
      </h2>
      {children}
    </div>
  );
}

// ── Action buttons row ──────────────────────────────────────────────────────
function ActionButtons({ job }: { job: Job }) {
  if (!job.official_url && !job.notification_pdf) return null;
  return (
    <div className="flex gap-3 flex-wrap">
      {job.official_url && (
        <a
          href={job.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex-1 text-center"
          style={{ minWidth: "130px" }}
        >
          Apply Online →
        </a>
      )}
      {job.notification_pdf && (
        <a
          href={job.notification_pdf}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center"
          style={{
            border: "2px solid var(--brand-blue)",
            color: "var(--brand-blue)",
            padding: "8px 16px",
            borderRadius: "var(--r-md)",
            fontSize: "0.875rem",
            fontWeight: 600,
            minWidth: "130px",
            transition: "background 150ms, color 150ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--brand-blue)";
            (e.currentTarget as HTMLElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--brand-blue)";
          }}
        >
          {job.notification_pdf?.endsWith(".pdf") ? "📄 Notification PDF" : "🔗 View Details"}
        </a>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let job: Job;
  try {
    job = await getJob(slug);
  } catch {
    notFound();
  }

  const catLabel   = CATEGORY_LABELS[job.category] ?? job.category.toUpperCase();
  const catHindi   = CATEGORY_HINDI[job.category]  ?? job.category.toUpperCase();

  const isExpiringSoon = job.last_date
    ? (new Date(job.last_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 7
    : false;

  const fmtDate = (d?: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : null;

  const ageLabel =
    job.age_min && job.age_max ? `${job.age_min}–${job.age_max} वर्ष` :
    job.age_max                ? `अधिकतम ${job.age_max} वर्ष`         :
    null;

  const howToApply = [
    "ऊपर दिए गए 'Apply Online' बटन पर क्लिक करें और आधिकारिक वेबसाइट पर जाएं",
    '"Apply Online" या "ऑनलाइन आवेदन" लिंक पर क्लिक करें',
    "मोबाइल नंबर / ईमेल से नया रजिस्ट्रेशन करें",
    "फॉर्म भरें — फोटो, हस्ताक्षर और दस्तावेज अपलोड करें",
    "आवेदन शुल्क ऑनलाइन जमा करें (डेबिट कार्ड / नेट बैंकिंग / UPI)",
    "सबमिट करें और कन्फर्मेशन पेज का प्रिंटआउट रखें",
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateJobSchema(job)) }}
      />

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          <Link href="/" className="hover:text-brand">Home</Link>
          {" / "}
          <Link href={`/?category=${job.category}`} className="hover:text-brand capitalize">
            {catLabel}
          </Link>
          {" / "}
          <span className="text-gray-700 dark:text-gray-300">{job.title.slice(0, 45)}</span>
        </nav>

        {/* Title hero card */}
        <div className="card" style={{ borderLeft: "4px solid var(--brand-blue)" }}>
          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`badge badge-${job.category}`}>{catLabel}</span>
            {job.status === "result_out" && (
              <span className="badge" style={{ background: "#dcfce7", color: "#166534" }}>✓ Result Out</span>
            )}
            {job.status === "admit_card" && (
              <span className="badge" style={{ background: "#fef9c3", color: "#854d0e" }}>Admit Card</span>
            )}
            {isExpiringSoon && job.status === "active" && (
              <span className="badge" style={{ background: "#fee2e2", color: "#991b1b" }}>⚠ Closing Soon</span>
            )}
          </div>

          <h1
            className="hindi leading-snug"
            style={{ fontWeight: 700, fontSize: "clamp(1rem, 3vw, 1.25rem)", color: "var(--ink-900)" }}
          >
            {job.title}
          </h1>
          {job.title_hindi && (
            <p className="hindi mt-1" style={{ fontSize: "0.85rem", color: "var(--ink-600)" }}>
              {job.title_hindi}
            </p>
          )}

          {/* Key metrics strip */}
          <div
            className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 pt-3"
            style={{
              borderTop: "1px solid var(--border-soft)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
            }}
          >
            {job.total_posts && (
              <span style={{ fontWeight: 700, color: "var(--brand-blue)" }}>
                📋 {job.total_posts.toLocaleString("en-IN")} Posts
              </span>
            )}
            {job.qualification && (
              <span style={{ color: "var(--ink-600)" }}>🎓 {job.qualification}</span>
            )}
            {job.last_date && (
              <span style={{ fontWeight: 600, color: isExpiringSoon ? "var(--red)" : "var(--ink-600)" }}>
                📅 {fmtDate(job.last_date)}
              </span>
            )}
            {job.last_date && <Countdown lastDate={job.last_date} lang="hi" />}
          </div>
        </div>

        {/* Top CTAs */}
        <ActionButtons job={job} />

        {/* Important Dates */}
        {(job.apply_start || job.last_date) && (
          <Section icon="📅" title="महत्वपूर्ण तिथियाँ">
            <table className="w-full">
              <tbody>
                <InfoRow label="आवेदन शुरू"  value={fmtDate(job.apply_start)} />
                <InfoRow label="अंतिम तिथि"  value={fmtDate(job.last_date)} highlight={isExpiringSoon} />
              </tbody>
            </table>
          </Section>
        )}

        {/* Vacancy & Eligibility */}
        <Section icon="📋" title="भर्ती विवरण">
          <table className="w-full">
            <tbody>
              <InfoRow label="कुल पद"         value={job.total_posts ? `${job.total_posts.toLocaleString("en-IN")} Posts` : null} />
              <InfoRow label="विभाग"           value={`${catLabel} (${catHindi})`} />
              <InfoRow label="पद का नाम"       value={job.post_type} />
              <InfoRow label="शैक्षिक योग्यता" value={job.qualification} />
              <InfoRow label="आयु सीमा"        value={ageLabel} />
              <InfoRow label="वेतनमान"          value={job.salary} />
              <InfoRow label="आवेदन शुल्क"     value={job.application_fee} />
              <InfoRow label="स्रोत"            value={job.source} />
            </tbody>
          </table>
        </Section>

        {/* How to Apply */}
        <Section icon="📝" title="आवेदन कैसे करें">
          <ol className="space-y-2.5">
            {howToApply.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="flex-shrink-0 w-5 h-5 bg-brand text-white text-xs rounded-full flex items-center justify-center font-bold mt-0.5">
                  {i + 1}
                </span>
                <span className="hindi">{step}</span>
              </li>
            ))}
          </ol>
          {job.notification_pdf && (
            <p className="hindi text-xs text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              पूरी जानकारी के लिए{" "}
              <a
                href={job.notification_pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline"
              >
                आधिकारिक नोटिफिकेशन PDF
              </a>{" "}
              डाउनलोड करें।
            </p>
          )}
        </Section>

        {/* Telegram CTA */}
        <div
          className="card text-center"
          style={{ background: "#eef3fc", borderColor: "#c7d7f5" }}
        >
          <p className="hindi mb-3" style={{ fontSize: "0.875rem", color: "var(--ink-700)" }}>
            इस तरह की और भर्तियों का अलर्ट Telegram पर पाएं — बिल्कुल मुफ्त
          </p>
          <a
            href="https://t.me/your_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            🔔 <span className="hindi">Telegram अलर्ट चालू करें</span>
          </a>
        </div>

        {/* Bottom CTAs */}
        <ActionButtons job={job} />

        {/* Back to category */}
        <div className="text-center pb-2">
          <Link href={`/?category=${job.category}`} className="text-sm text-brand hover:underline">
            ← See all {catLabel} jobs
          </Link>
        </div>
      </div>
    </>
  );
}
