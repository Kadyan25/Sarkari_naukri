import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob, getRecentJobSlugs } from "@/lib/api";
import { Job } from "@/lib/types";
import Countdown from "@/components/Countdown";

// Pre-render the 100 most recent job pages at build time — instant first load
export async function generateStaticParams() {
  const slugs = await getRecentJobSlugs(100);
  return slugs.map((slug) => ({ slug }));
}

// Fall through to ISR for any job not pre-rendered
export const dynamicParams = true;

interface PageProps {
  params: { slug: string };
}

// ── JobPosting JSON-LD schema — gets into Google Jobs tab ─────────────────
function generateJobSchema(job: Job) {
  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": [
      job.title_hindi,
      job.qualification ? `Qualification: ${job.qualification}` : null,
      job.total_posts   ? `Total Posts: ${job.total_posts}` : null,
      job.salary        ? `Salary: ${job.salary}` : null,
      job.application_fee ? `Application Fee: ${job.application_fee}` : null,
    ].filter(Boolean).join(". "),
    "datePosted": job.created_at,
    "validThrough": job.last_date ? `${job.last_date}T23:59:59` : undefined,
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Government of Haryana",
      "sameAs": job.official_url ?? "https://haryana.gov.in",
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "Haryana",
        "addressCountry": "IN",
      },
    },
    ...(job.salary && {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": { "@type": "QuantitativeValue", "description": job.salary },
      },
    }),
  };
}

// ── Metadata ───────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const job = await getJob(params.slug);
    return {
      title: `${job.title} 2025`,
      description: [
        job.title_hindi,
        job.total_posts ? `${job.total_posts} पद` : null,
        job.last_date ? `अंतिम तिथि: ${job.last_date}` : null,
        job.qualification ? `योग्यता: ${job.qualification}` : null,
      ].filter(Boolean).join(" | "),
      alternates: { canonical: `/job/${job.slug}` },
      openGraph: {
        title: job.title,
        description: `${job.total_posts ?? ""} posts | Last date: ${job.last_date ?? ""}`,
        type: "article",
      },
    };
  } catch {
    return {};
  }
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function JobDetailPage({ params }: PageProps) {
  let job: Job;
  try {
    job = await getJob(params.slug);
  } catch {
    notFound();
  }

  const schema = generateJobSchema(job);

  const details: { label: string; value: string | number | undefined; hindi?: boolean }[] = [
    { label: "पद संख्या",    value: job.total_posts?.toLocaleString("hi-IN"), hindi: true },
    { label: "अंतिम तिथि",   value: job.last_date
        ? new Date(job.last_date).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })
        : undefined, hindi: true },
    { label: "आवेदन शुरू",   value: job.apply_start
        ? new Date(job.apply_start).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })
        : undefined, hindi: true },
    { label: "शैक्षिक योग्यता", value: job.qualification, hindi: true },
    { label: "आयु सीमा",     value:
        job.age_min && job.age_max ? `${job.age_min}–${job.age_max} वर्ष` :
        job.age_max ? `अधिकतम ${job.age_max} वर्ष` : undefined, hindi: true },
    { label: "वेतनमान",      value: job.salary, hindi: true },
    { label: "आवेदन शुल्क",  value: job.application_fee, hindi: true },
    { label: "विभाग",        value: job.category?.toUpperCase() },
    { label: "स्रोत",        value: job.source },
  ].filter((d) => d.value !== undefined && d.value !== "");

  return (
    <>
      {/* JobPosting JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span className="mx-1">/</span>
          <Link href={`/${job.category}`} className="hover:text-brand capitalize">
            {job.category}
          </Link>
          <span className="mx-1">/</span>
          <span className="text-gray-700 truncate">{job.title.slice(0, 40)}</span>
        </nav>

        {/* Title Card */}
        <div className="card border-l-4 border-brand">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="font-bold text-base sm:text-xl text-gray-900 leading-snug">
                {job.title}
              </h1>
              {job.title_hindi && (
                <p className="hindi text-sm text-gray-500 mt-1">{job.title_hindi}</p>
              )}
            </div>
            {job.last_date && (
              <div className="flex-shrink-0 text-right">
                <Countdown lastDate={job.last_date} />
              </div>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="card">
          <h2 className="hindi font-semibold text-gray-800 mb-3">भर्ती विवरण</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
            {details.map((d) => (
              <div key={d.label} className="flex flex-col">
                <dt className={`text-xs text-gray-400 ${d.hindi ? "hindi" : ""}`}>
                  {d.label}
                </dt>
                <dd className={`text-sm font-semibold text-gray-800 ${d.hindi ? "hindi" : ""}`}>
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {job.official_url && (
            <a
              href={job.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-center flex-1"
            >
              🌐 <span className="hindi">आधिकारिक वेबसाइट</span>
            </a>
          )}
          {job.notification_pdf && (
            <a
              href={job.notification_pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center border border-brand text-brand px-4 py-2
                         rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors"
            >
              📄 <span className="hindi">नोटिफिकेशन PDF</span>
            </a>
          )}
        </div>

        {/* Telegram CTA */}
        <div className="card bg-blue-50 border-blue-200 text-center">
          <p className="hindi text-sm text-gray-700 mb-2">
            इस तरह की और भर्तियों का अलर्ट Telegram पर पाएं — बिल्कुल मुफ्त
          </p>
          <a
            href="https://t.me/your_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            🔔 <span className="hindi">Telegram अलर्ट चालू करें</span>
          </a>
        </div>

        {/* Important Dates */}
        {(job.apply_start || job.last_date) && (
          <div className="card">
            <h2 className="hindi font-semibold text-gray-800 mb-3">महत्वपूर्ण तिथियाँ</h2>
            <div className="space-y-2">
              {job.apply_start && (
                <div className="flex justify-between text-sm">
                  <span className="hindi text-gray-600">आवेदन शुरू</span>
                  <span className="font-medium">
                    {new Date(job.apply_start).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {job.last_date && (
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="hindi text-gray-600">अंतिम तिथि</span>
                  <span className="font-bold text-red-600">
                    {new Date(job.last_date).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
