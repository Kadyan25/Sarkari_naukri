import type { Metadata } from "next";
import { getJobs } from "@/lib/api";
import JobCard from "@/components/JobCard";

export const metadata: Metadata = {
  title: "HSSC Admit Card 2025 | हरियाणा Admit Card Download",
  description:
    "HSSC, HPSC, हरियाणा पुलिस 2025 के Admit Card यहाँ से डाउनलोड करें। Hall Ticket, Call Letter सबसे पहले यहाँ।",
  keywords: [
    "hssc admit card 2025",
    "haryana admit card",
    "hssc hall ticket",
    "hpsc admit card",
    "haryana police admit card 2025",
  ],
  alternates: { canonical: "/admit-card" },
};

export default async function AdmitCardPage() {
  let jobs = [];
  try {
    const res = await getJobs({ status: "admit_card", limit: 30 });
    jobs = res.jobs;
  } catch {
    // show empty state
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card bg-yellow-50 border-yellow-200">
        <h1 className="font-bold text-base sm:text-xl text-yellow-800">
          🎫 Admit Card 2025
        </h1>
        <p className="hindi text-sm text-yellow-700 mt-1">
          HSSC · HPSC · पुलिस — Admit Card / Hall Ticket यहाँ से डाउनलोड करें
        </p>
      </div>

      {/* SEO intro */}
      <p className="hindi text-sm text-gray-600 leading-relaxed">
        हरियाणा की सभी सरकारी परीक्षाओं के Admit Card यहाँ उपलब्ध हैं।
        HSSC Admit Card 2025, HPSC Hall Ticket, हरियाणा पुलिस Call Letter —
        सभी एक जगह। नई Admit Card के लिए Telegram अलर्ट चालू करें।
      </p>

      {/* Jobs with admit_card status */}
      {jobs.length === 0 ? (
        <div className="card text-center py-10 space-y-3">
          <p className="hindi text-gray-500">
            अभी कोई Admit Card उपलब्ध नहीं है।
          </p>
          <a
            href="https://t.me/your_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            🔔 <span className="hindi">Admit Card अलर्ट पाएं</span>
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Important links */}
      <div className="card">
        <h2 className="hindi font-semibold text-gray-800 mb-3">
          Admit Card — आधिकारिक वेबसाइट
        </h2>
        <ul className="space-y-2 text-sm">
          {[
            { name: "HSSC",           url: "https://hssc.gov.in" },
            { name: "HPSC",           url: "https://hpsc.gov.in" },
            { name: "Haryana Police", url: "https://haryanapolicerecruitment.gov.in" },
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
    </div>
  );
}
