"""
ncs_api.py — NCS Portal (ncs.gov.in) API client.
Provides 20% of job data via official free API.
Register at ncs.gov.in to get NCS_API_KEY.
"""
import logging
from typing import Any, Dict, List, Optional

import httpx

from config import NCS_API_BASE, NCS_API_KEY
from scraper import detect_category, detect_qualification, slugify

logger = logging.getLogger(__name__)


async def fetch_ncs_jobs(state: str = "Haryana", page: int = 1) -> List[Dict[str, Any]]:
    """Fetch govt jobs from NCS Portal API for a given state."""
    if not NCS_API_KEY:
        logger.warning("NCS_API_KEY not set — skipping NCS fetch")
        return []

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(
                f"{NCS_API_BASE}/jobs",
                params={"state": state, "sector": "government", "page": page},
                headers={"Authorization": f"Bearer {NCS_API_KEY}"},
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error("NCS API HTTP error: %s", exc)
            return []
        except Exception as exc:
            logger.error("NCS API fetch failed: %s", exc)
            return []

    raw_jobs = data.get("jobs") or data.get("data") or []
    jobs: List[Dict[str, Any]] = []

    for item in raw_jobs:
        title = (item.get("job_title") or item.get("title") or "").strip()
        if not title:
            continue

        jobs.append({
            "title":         title,
            "slug":          slugify(title),
            "category":      detect_category(title),
            "qualification": item.get("qualification") or detect_qualification(title),
            "total_posts":   _safe_int(item.get("vacancies") or item.get("total_posts")),
            "last_date":     _parse_ncs_date(item.get("last_date") or item.get("application_end_date")),
            "apply_start":   _parse_ncs_date(item.get("application_start_date")),
            "age_min":       _safe_int(item.get("age_min")),
            "age_max":       _safe_int(item.get("age_max")),
            "salary":        item.get("salary") or item.get("pay_scale"),
            "official_url":  item.get("apply_url") or item.get("job_url"),
            "source":        "ncs_api",
            "state":         "haryana",
            "status":        "active",
        })

    logger.info("fetch_ncs_jobs page=%d state=%s: got %d jobs", page, state, len(jobs))
    return jobs


async def fetch_all_ncs_jobs(state: str = "Haryana", max_pages: int = 5) -> List[Dict[str, Any]]:
    """Paginate through NCS API results."""
    all_jobs: List[Dict[str, Any]] = []
    for page in range(1, max_pages + 1):
        jobs = await fetch_ncs_jobs(state=state, page=page)
        if not jobs:
            break
        all_jobs.extend(jobs)
    logger.info("fetch_all_ncs_jobs: total %d jobs across %d pages", len(all_jobs), max_pages)
    return all_jobs


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_int(val: Any) -> Optional[int]:
    try:
        return int(val) if val is not None else None
    except (ValueError, TypeError):
        return None


def _parse_ncs_date(val: Any):
    """Parse NCS API date strings (ISO 8601 or DD-MM-YYYY)."""
    if not val:
        return None
    from scraper import parse_last_date
    return parse_last_date(str(val).split("T")[0])  # strip time part if ISO
