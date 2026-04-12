import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.in";
const API_URL  = process.env.NEXT_PUBLIC_API_URL  || "http://localhost:8000";

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: SITE_URL,               changeFrequency: "hourly",  priority: 1.0 },
  { url: `${SITE_URL}/admit-card`, changeFrequency: "daily",  priority: 0.9 },
  { url: `${SITE_URL}/result`,     changeFrequency: "daily",  priority: 0.9 },
  { url: `${SITE_URL}/hssc`,       changeFrequency: "hourly", priority: 0.8 },
  { url: `${SITE_URL}/hpsc`,       changeFrequency: "hourly", priority: 0.8 },
  { url: `${SITE_URL}/police`,     changeFrequency: "hourly", priority: 0.8 },
  { url: `${SITE_URL}/banking`,    changeFrequency: "daily",  priority: 0.7 },
  { url: `${SITE_URL}/railway`,    changeFrequency: "daily",  priority: 0.7 },
  { url: `${SITE_URL}/ssc`,        changeFrequency: "daily",  priority: 0.7 },
  { url: `${SITE_URL}/teacher`,    changeFrequency: "daily",  priority: 0.7 },
  { url: `${SITE_URL}/patwari`,    changeFrequency: "daily",  priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all active job slugs from API
  let jobEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/api/jobs?limit=500&status=active`, {
      next: { revalidate: 1800 }, // regenerate sitemap every 30 min
    });
    if (res.ok) {
      const data = await res.json();
      jobEntries = (data.jobs ?? []).map((job: { slug: string; updated_at: string }) => ({
        url:             `${SITE_URL}/job/${job.slug}`,
        lastModified:    new Date(job.updated_at),
        changeFrequency: "weekly" as const,
        priority:        0.6,
      }));
    }
  } catch {
    // API unavailable at build time — sitemap will only have static pages
  }

  return [...STATIC_PAGES, ...jobEntries];
}
