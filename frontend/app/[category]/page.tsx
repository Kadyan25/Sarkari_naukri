import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobs } from "@/lib/api";
import JobCard from "@/components/JobCard";
import { CATEGORY_LABELS, CATEGORY_HINDI } from "@/lib/types";

const VALID_CATEGORIES = [
  "hssc", "hpsc", "police", "patwari", "teacher", "banking", "railway", "ssc",
];

interface PageProps {
  params:       Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: cat } = await params;
  if (!VALID_CATEGORIES.includes(cat)) return {};
  const label = CATEGORY_LABELS[cat] ?? cat.toUpperCase();
  const hindi = CATEGORY_HINDI[cat] ?? label;
  return {
    title: `${label} Recruitment 2025 | ${hindi} भर्ती`,
    description: `${label} की सभी नई भर्तियां 2025 — अंतिम तिथि, पद, योग्यता, वेतन। ${hindi} भर्ती अलर्ट Telegram पर मुफ्त पाएं।`,
    alternates: { canonical: `/${cat}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category: cat } = await params;
  const sp   = await searchParams;
  const page = Number(sp.page || 1);

  if (!VALID_CATEGORIES.includes(cat)) notFound();

  const label = CATEGORY_LABELS[cat] ?? cat.toUpperCase();
  const hindi = CATEGORY_HINDI[cat] ?? label;

  let jobs = [];
  try {
    const res = await getJobs({ category: cat, page, limit: 20 });
    jobs = res.jobs;
  } catch {
    // show empty state
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-700 dark:text-gray-300">{hindi} भर्ती</span>
      </nav>

      {/* Header */}
      <div className="card bg-brand-light border-brand/20 dark:bg-gray-800">
        <h1 className="font-bold text-base sm:text-xl text-brand">
          {label} Recruitment 2025
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {hindi} की नई भर्तियां — अंतिम तिथि, पद संख्या, योग्यता सहित
        </p>
      </div>

      {/* Jobs */}
      {jobs.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          अभी कोई भर्ती उपलब्ध नहीं है।
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {jobs.length === 20 && (
        <div className="flex justify-center mt-4 gap-3">
          {page > 1 && (
            <Link href={`/${cat}?page=${page - 1}`} className="btn-primary">← पिछला</Link>
          )}
          <Link href={`/${cat}?page=${page + 1}`} className="btn-primary">अगला →</Link>
        </div>
      )}

      {/* SEO text */}
      <section className="card mt-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {hindi} भर्ती 2025 — पूरी जानकारी
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {label} की सभी ताजा भर्तियां यहाँ उपलब्ध हैं।
          हर भर्ती के लिए अधिसूचना PDF, ऑनलाइन आवेदन लिंक,
          अंतिम तिथि और पात्रता की जानकारी दी जाती है।
          Telegram चैनल से जुड़ें और हर नई भर्ती का अलर्ट पाएं।
        </p>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return VALID_CATEGORIES.map((cat) => ({ category: cat }));
}
