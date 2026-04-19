import { Job, JobsResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Revalidate times tuned per data freshness needs
const REVALIDATE = {
  jobList:   300,   // 5 min — new jobs appear hourly, 5 min is responsive enough
  jobDetail: 1800,  // 30 min — individual jobs rarely change once posted
  status:    180,   // 3 min — admit card / result pages change frequently during exam season
};

async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number>,
  revalidate = REVALIDATE.jobList,
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }
  const res = await fetch(
    url.toString(),
    process.env.NODE_ENV === "development"
      ? { cache: "no-store" }
      : { next: { revalidate } },
  );
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export async function getJobs(params?: {
  category?: string;
  qualification?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<JobsResponse> {
  // Status pages (admit card/result) get shorter cache — high-traffic + frequently updated
  const revalidate =
    params?.status && params.status !== "active"
      ? REVALIDATE.status
      : REVALIDATE.jobList;
  return apiFetch<JobsResponse>("/api/jobs", params as Record<string, string | number>, revalidate);
}

export async function getJob(slug: string): Promise<Job> {
  return apiFetch<Job>(`/api/jobs/${slug}`, undefined, REVALIDATE.jobDetail);
}

export async function getRecommendedJobs(params: {
  qualification: string;
  age: number;
  category?: string;
}): Promise<{ jobs: Job[]; count: number }> {
  return apiFetch(
    "/api/jobs/recommend",
    params as Record<string, string | number>,
    REVALIDATE.jobList,
  );
}

// Used by generateStaticParams to pre-render the top N job detail pages at build time
export async function getRecentJobSlugs(limit = 100): Promise<string[]> {
  try {
    const res = await apiFetch<JobsResponse>("/api/jobs", { limit, status: "active" });
    return res.jobs.map((j) => j.slug);
  } catch {
    return [];
  }
}
