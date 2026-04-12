import type { Metadata } from "next";
import Link from "next/link";
import { getJobs } from "@/lib/api";
import JobCard from "@/components/JobCard";
import CategoryTabs from "@/components/CategoryTabs";

export const metadata: Metadata = {
  title: "Haryana Sarkari Naukri 2025 | हरियाणा सरकारी नौकरी",
  description:
    "हरियाणा की सभी सरकारी नौकरियां — HSSC, HPSC, Police, Banking, Railway 2025. रोज अपडेट। Telegram अलर्ट मुफ्त।",
};

interface PageProps {
  searchParams: { category?: string; page?: string };
}

export default async function HomePage({ searchParams }: PageProps) {
  const category = searchParams.category || "";
  const page     = Number(searchParams.page || 1);

  let jobs = [];
  let error = false;
  try {
    const res = await getJobs({ category: category || undefined, page, limit: 20 });
    jobs = res.jobs;
  } catch {
    error = true;
  }

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="bg-gradient-to-r from-brand to-brand-dark rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-lg sm:text-2xl font-bold leading-tight">
          हरियाणा सरकारी नौकरी 2025
        </h1>
        <p className="hindi text-blue-100 text-sm mt-1">
          HSSC · HPSC · Police · Banking · Railway — रोज नई भर्ती
        </p>
        <a
          href="https://t.me/your_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 bg-white text-brand
                     px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
        >
          🔔 <span className="hindi">Telegram पर अलर्ट पाएं — मुफ्त</span>
        </a>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "ताजा भर्ती",    value: "500+",  hindi: true },
          { label: "रोज अपडेट",     value: "24/7",  hindi: true },
          { label: "Telegram Users", value: "10K+",  hindi: false },
        ].map((stat) => (
          <div key={stat.label} className="card text-center py-3">
            <div className="text-lg font-bold text-brand">{stat.value}</div>
            <div className={`text-xs text-gray-500 ${stat.hindi ? "hindi" : ""}`}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Category Tabs */}
      <section>
        <h2 className="hindi text-sm font-semibold text-gray-700 mb-2">
          विभाग चुनें
        </h2>
        <CategoryTabs active={category} />
      </section>

      {/* Jobs List */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="hindi font-semibold text-gray-800">
            {category
              ? `${category.toUpperCase()} भर्ती 2025`
              : "ताजा सरकारी नौकरियां"}
          </h2>
          {jobs.length > 0 && (
            <span className="text-xs text-gray-400">{jobs.length} jobs</span>
          )}
        </div>

        {error && (
          <div className="card text-center py-8 text-red-500 hindi">
            डेटा लोड नहीं हो सका। कृपया दोबारा कोशिश करें।
          </div>
        )}

        {!error && jobs.length === 0 && (
          <div className="card text-center py-8 text-gray-400 hindi">
            अभी कोई भर्ती उपलब्ध नहीं है।
          </div>
        )}

        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {/* Pagination */}
        {jobs.length === 20 && (
          <div className="flex justify-center mt-6 gap-3">
            {page > 1 && (
              <Link href={`/?category=${category}&page=${page - 1}`} className="btn-primary">
                ← पिछला
              </Link>
            )}
            <Link href={`/?category=${category}&page=${page + 1}`} className="btn-primary">
              अगला →
            </Link>
          </div>
        )}
      </section>

      {/* SEO Text Block */}
      <section className="card mt-6">
        <h2 className="hindi font-semibold text-gray-800 mb-2">
          हरियाणा सरकारी नौकरी के बारे में
        </h2>
        <p className="hindi text-sm text-gray-600 leading-relaxed">
          हरियाणा में सरकारी नौकरी पाने का सपना देखने वाले सभी युवाओं के लिए
          यह प्लेटफॉर्म बना है। यहाँ HSSC, HPSC, हरियाणा पुलिस, बैंकिंग,
          रेलवे और SSC की सभी भर्तियां एक ही जगह मिलती हैं।
          हर नई भर्ती के लिए Telegram अलर्ट पाएं — बिल्कुल मुफ्त।
        </p>
      </section>
    </div>
  );
}
