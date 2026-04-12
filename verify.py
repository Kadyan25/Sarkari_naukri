"""
verify.py — Data verification script (run after first scrape).
Confirms jobs are in DB, checks data quality, spots slugs/dates issues.
Usage: python verify.py
"""
import asyncio

from db import close_db, db_get_all_jobs, init_db


async def verify():
    await init_db()

    jobs = await db_get_all_jobs(limit=100)
    total = len(jobs)

    haryana   = sum(1 for j in jobs if j.get("state") == "haryana")
    active    = sum(1 for j in jobs if j.get("status") == "active")

    missing_date  = [j["title"] for j in jobs if not j.get("last_date")]
    missing_cat   = [j["title"] for j in jobs if not j.get("category")]
    missing_slug  = [j["title"] for j in jobs if not j.get("slug")]
    slugs         = [j["slug"] for j in jobs if j.get("slug")]
    duplicates    = len(slugs) - len(set(slugs))

    print("=" * 55)
    print("  HARYANA NAUKRI — DB VERIFICATION REPORT")
    print("=" * 55)
    print(f"  Total jobs      : {total}")
    print(f"  Haryana jobs    : {haryana}")
    print(f"  Active jobs     : {active}")
    print(f"  Missing last_date : {len(missing_date)}")
    print(f"  Missing category  : {len(missing_cat)}")
    print(f"  Missing slug      : {len(missing_slug)}")
    print(f"  Duplicate slugs   : {duplicates}")
    print("=" * 55)

    if total < 20:
        print(f"⚠️  WARNING: Only {total} jobs found. Expected 20+.")
        print("   Run a manual scrape: POST /api/scrape/trigger")
    else:
        print(f"✅ Job count OK ({total} jobs)")

    if duplicates:
        print(f"⚠️  {duplicates} duplicate slugs — check slugify() logic")

    if missing_date:
        print(f"\n⚠️  Missing last_date ({len(missing_date)}):")
        for t in missing_date[:5]:
            print(f"    - {t}")

    # Category breakdown
    from collections import Counter
    cats = Counter(j.get("category", "unknown") for j in jobs)
    print("\n--- Category Breakdown ---")
    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {cat:<15} {count}")

    # Source breakdown
    sources = Counter(j.get("source", "unknown") for j in jobs)
    print("\n--- Source Breakdown ---")
    for src, count in sorted(sources.items(), key=lambda x: -x[1]):
        print(f"  {src:<20} {count}")

    # Sample jobs
    print("\n--- Sample (first 5) ---")
    for j in jobs[:5]:
        cat  = (j.get("category") or "?").upper()
        title = j.get("title", "?")[:55]
        date  = j.get("last_date") or "no date"
        print(f"  [{cat:<8}] {title:<55} | {date}")

    print("=" * 55)

    # Spot-check URLs
    print("\n📌 Manual spot-check:")
    print("   HSSC    : https://hssc.gov.in/")
    print("   SrkRes  : https://www.sarkariresult.com/haryana/")
    print("   Telegram: Send /jobs to your bot → expect 5 latest Haryana jobs")

    await close_db()


if __name__ == "__main__":
    asyncio.run(verify())
