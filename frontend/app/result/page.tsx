import type { Metadata } from "next";
import { getJobs } from "@/lib/api";
import JobCard from "@/components/JobCard";

export const metadata: Metadata = {
  title: "HSSC Result 2025 | हरियाणा Result Check Online",
  description:
    "HSSC Result 2025, HPSC Result, हरियाणा पुलिस Result यहाँ देखें। Cut Off Marks, Merit List, Selection List — सबसे पहले यहाँ।",
  keywords: [
    "hssc result 2025",
    "haryana result",
    "hssc cut off",
    "hpsc result 2025",
    "haryana police result",
    "hssc merit list",
  ],
  alternates: { canonical: "/result" },
};

export default async function ResultPage() {
  let jobs = [];
  try {
    const res = await getJobs({ status: "result_out", limit: 30 });
    jobs = res.jobs;
  } catch {
    // show empty state
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card bg-green-50 border-green-200">
        <h1 className="font-bold text-base sm:text-xl text-green-800">
          ✅ Result 2025
        </h1>
        <p className="hindi text-sm text-green-700 mt-1">
          HSSC · HPSC · पुलिस — Result, Merit List, Cut Off यहाँ देखें
        </p>
      </div>

      {/* SEO intro */}
      <p className="hindi text-sm text-gray-600 leading-relaxed">
        हरियाणा की सभी सरकारी परीक्षाओं के Results यहाँ उपलब्ध हैं।
        HSSC Result 2025, HPSC Merit List, हरियाणा पुलिस Selection List —
        सभी एक जगह। नए Result के लिए Telegram अलर्ट चालू करें।
      </p>

      {/* Jobs with result_out status */}
      {jobs.length === 0 ? (
        <div className="card text-center py-10 space-y-3">
          <p className="hindi text-gray-500">
            अभी कोई Result उपलब्ध नहीं है।
          </p>
          <a
            href="https://t.me/your_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            🔔 <span className="hindi">Result अलर्ट पाएं</span>
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Check result section */}
      <div className="card">
        <h2 className="hindi font-semibold text-gray-800 mb-3">
          Result — आधिकारिक वेबसाइट
        </h2>
        <ul className="space-y-2 text-sm">
          {[
            { name: "HSSC Result",          url: "https://hssc.gov.in" },
            { name: "HPSC Result",          url: "https://hpsc.gov.in" },
            { name: "Haryana Police Result", url: "https://haryanapolicerecruitment.gov.in" },
          ].map((site) => (
            <li key={site.name}>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                {site.name} →
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* SEO text */}
      <div className="card">
        <h2 className="hindi font-semibold text-gray-800 mb-2">
          हरियाणा सरकारी परीक्षा Result 2025
        </h2>
        <p className="hindi text-sm text-gray-600 leading-relaxed">
          HSSC (हरियाणा कर्मचारी चयन आयोग) द्वारा आयोजित सभी परीक्षाओं के
          Results यहाँ अपडेट किए जाते हैं। Cut Off Marks, Merit List,
          और Selection List के लिए Telegram अलर्ट चालू करें।
        </p>
      </div>
    </div>
  );
}
