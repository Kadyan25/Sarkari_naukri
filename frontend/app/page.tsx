import type { Metadata } from "next";
import { getJobs } from "@/lib/api";
import HomeContent from "@/components/HomeContent";

export const metadata: Metadata = {
  title: "Sarkari Naukri 2025 | सरकारी नौकरी",
  description:
    "सभी सरकारी नौकरियां एक जगह — HSSC, HPSC, Police, Banking, Railway 2025. रोज अपडेट। Telegram अलर्ट मुफ्त।",
};

interface PageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp       = await searchParams;
  const category = sp.category || "";
  const page     = Number(sp.page || 1);

  let jobs = [];
  let error = false;
  try {
    const res = await getJobs({ category: category || undefined, page, limit: 20 });
    jobs = res.jobs;
  } catch {
    error = true;
  }

  return <HomeContent jobs={jobs} error={error} category={category} page={page} />;
}
