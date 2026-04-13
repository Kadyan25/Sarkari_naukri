"""
scraper.py — Job scraping engine.
Adapted from crawler.py: keeps fetch logic, retry, random_headers.

Speed strategy for basic govt sites (no bot detection):
  - Shared persistent httpx.AsyncClient with connection pooling
  - All scrapers run concurrently via asyncio.gather
  - All DB upserts run concurrently via asyncio.gather
  - No artificial rate limiting (add back per-domain if a site starts blocking)
  - Semaphore caps total concurrent requests to avoid overloading slow servers
"""
import asyncio
import logging
import random
import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from config import _USER_AGENTS, SOURCES, random_headers

logger = logging.getLogger(__name__)

# Max concurrent outgoing requests across all scrapers combined
_CONCURRENCY = 8
_semaphore = asyncio.Semaphore(_CONCURRENCY)

# Shared persistent client — connection pooling, DNS caching, keep-alive
# Created once at import time, reused by all fetch calls
_client: Optional[httpx.AsyncClient] = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0),
            follow_redirects=True,
            http2=True,
            verify=False,                # Indian NIC/eMudhra certs not in default bundle
            limits=httpx.Limits(
                max_connections=20,
                max_keepalive_connections=10,
                keepalive_expiry=30,
            ),
        )
    return _client


async def close_client():
    """Call on app shutdown to cleanly close the shared client."""
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
        _client = None


# ---------------------------------------------------------------------------
# Core fetch — shared client + semaphore, minimal retry delay
# ---------------------------------------------------------------------------

async def fetch_page(url: str) -> Optional[str]:
    ua = random.choice(_USER_AGENTS)
    headers = random_headers(ua)
    client = _get_client()
    delay = 0.5   # short initial delay — only hits if server returns 429/503

    async with _semaphore:
        for attempt in range(3):
            try:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    return resp.text
                if resp.status_code in (429, 503):
                    # Server is struggling — back off briefly, then retry
                    wait = delay + random.uniform(0, 0.3)
                    logger.warning("Rate limited (%s) url=%s — retrying in %.1fs",
                                   resp.status_code, url, wait)
                    await asyncio.sleep(wait)
                    delay *= 2
                else:
                    logger.warning("HTTP %s url=%s", resp.status_code, url)
                    return None   # don't retry 4xx
            except (httpx.TimeoutException, httpx.ConnectError) as exc:
                logger.warning("Fetch error attempt=%d url=%s: %s", attempt, url, exc)
                if attempt < 2:
                    await asyncio.sleep(delay)
                    delay *= 2

    logger.error("fetch_page failed after 3 attempts url=%s", url)
    return None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def detect_category(title: str) -> str:
    t = title.lower()
    if "hssc" in t:                                  return "hssc"
    if "hpsc" in t:                                  return "hpsc"
    if "police" in t:                                return "police"
    if "patwari" in t:                               return "patwari"
    if "teacher" in t or "tgt" in t or "pgt" in t:  return "teacher"
    if "bank" in t or "ibps" in t or "sbi" in t:    return "banking"
    if "railway" in t or "rrb" in t:                return "railway"
    if "ssc" in t:                                   return "ssc"
    return "other"


def detect_qualification(title: str) -> str:
    t = title.lower()
    if "10th" in t or "matric" in t:                                      return "10th"
    if "12th" in t or "inter" in t:                                       return "12th"
    if "graduate" in t or "b.a" in t or "b.sc" in t or "b.tech" in t:    return "graduate"
    if "post graduate" in t or "postgraduate" in t or "m.a" in t:         return "postgraduate"
    return "any"


def slugify(title: str) -> str:
    slug = title.lower()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:120]


def parse_last_date(raw: str) -> Optional[date]:
    raw = raw.strip()
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%d-%b-%Y", "%d %b %Y",
                "%d-%B-%Y", "%B %d, %Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            pass
    match = re.search(r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})", raw)
    if match:
        for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%d-%m-%y"):
            try:
                return datetime.strptime(match.group(1), fmt).date()
            except ValueError:
                pass
    return None


def _dedup(jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: set = set()
    out = []
    for j in jobs:
        slug = j.get("slug", "")
        if slug and slug not in seen:
            seen.add(slug)
            out.append(j)
    return out


# ---------------------------------------------------------------------------
# Individual scrapers — each fetches independently, run in parallel
# ---------------------------------------------------------------------------

async def scrape_sarkariresult_haryana() -> List[Dict[str, Any]]:
    """SarkariResult /haryana/ — fastest + most consistent source, start here."""
    html = await fetch_page(SOURCES["sarkariresult_hr"])
    if not html:
        logger.error("scrape_sarkariresult_haryana: fetch returned None")
        return []

    soup = BeautifulSoup(html, "lxml")
    jobs: List[Dict[str, Any]] = []

    for row in soup.select("div#post table tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue
        title = cells[0].get_text(strip=True)
        if not title or len(title) < 5:
            continue
        link_tag = cells[0].find("a")
        jobs.append({
            "title":         title,
            "slug":          slugify(title),
            "last_date":     parse_last_date(cells[-1].get_text(strip=True)),
            "official_url":  link_tag["href"] if link_tag and link_tag.get("href") else "",
            "source":        "sarkariresult",
            "category":      detect_category(title),
            "qualification": detect_qualification(title),
            "state":         "haryana",
            "status":        "active",
        })

    result = _dedup(jobs)
    logger.info("scrape_sarkariresult_haryana: %d jobs", len(result))
    return result


async def scrape_hssc() -> List[Dict[str, Any]]:
    """HSSC official site."""
    html = await fetch_page(SOURCES["hssc"])
    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")
    jobs: List[Dict[str, Any]] = []

    for a in soup.select("a[href]"):
        raw = a.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", raw).strip()
        if not text or len(text) < 20:
            continue
        if not any(kw in text.lower() for kw in
                   ["recruitment", "bharti", "vacancy", "advt", "notification", "post",
                    "result", "admit", "answer key", "merit", "syllabus"]):
            continue
        href = a["href"]
        jobs.append({
            "title":         text,
            "slug":          slugify(text),
            "official_url":  href if href.startswith("http") else f"https://hssc.gov.in{href}",
            "source":        "hssc",
            "category":      "hssc",
            "qualification": detect_qualification(text),
            "state":         "haryana",
            "status":        "active",
        })

    result = _dedup(jobs)
    logger.info("scrape_hssc: %d jobs", len(result))
    return result


async def scrape_hpsc() -> List[Dict[str, Any]]:
    """HPSC official site."""
    html = await fetch_page(SOURCES["hpsc"])
    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")
    jobs: List[Dict[str, Any]] = []

    for a in soup.select("a[href]"):
        raw = a.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", raw).strip()
        if not text or len(text) < 20:
            continue
        if not any(kw in text.lower() for kw in
                   ["recruitment", "vacancy", "advt", "notification", "post", "bharti",
                    "result", "admit", "answer key", "merit", "interview"]):
            continue
        href = a["href"]
        jobs.append({
            "title":         text,
            "slug":          slugify(text),
            "official_url":  href if href.startswith("http") else f"https://hpsc.gov.in{href}",
            "source":        "hpsc",
            "category":      "hpsc",
            "qualification": detect_qualification(text),
            "state":         "haryana",
            "status":        "active",
        })

    result = _dedup(jobs)
    logger.info("scrape_hpsc: %d jobs", len(result))
    return result


async def scrape_haryana_police() -> List[Dict[str, Any]]:
    """
    Haryana Police official site — Public Notice page.
    Note: haryanapolicerecruitment.gov.in is dead (domain gone).
    Police constable/SI vacancies are now notified via HSSC, so this scraper
    catches police-specific notices & admit cards from haryanapolice.gov.in.
    """
    html = await fetch_page(SOURCES["haryana_police"])
    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")
    jobs: List[Dict[str, Any]] = []

    for a in soup.select("a[href]"):
        # Normalize internal whitespace (site has lots of \r\n in link text)
        raw = a.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", raw).strip()
        if not text or len(text) < 25:
            continue
        tl = text.lower()
        # Must mention a recruitment/result keyword AND a year to avoid nav links
        has_keyword = any(kw in tl for kw in
                          ["recruitment", "constable", "vacancy", "bharti",
                           "result", "admit card", "answer key", "selection list"])
        has_year = any(yr in text for yr in ["2024", "2025", "2026"])
        if not has_keyword or not has_year:
            continue
        href = a["href"]
        jobs.append({
            "title":         text,
            "slug":          slugify(text),
            "official_url":  href if href.startswith("http") else f"https://haryanapolice.gov.in/{href}",
            "source":        "haryana_police",
            "category":      "police",
            "qualification": detect_qualification(text),
            "state":         "haryana",
            "status":        "active",
        })

    result = _dedup(jobs)
    logger.info("scrape_haryana_police: %d jobs", len(result))
    return result


async def scrape_haryanajobs() -> List[Dict[str, Any]]:
    """
    haryanajobs.in aggregator — replaces dead hreyajna.gov.in domain.
    Returns 40-60 job links per scrape across Haryana + all-India sources.
    Filters for recruitment/result/admit card links only.
    """
    html = await fetch_page(SOURCES["haryanajobs"])
    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")
    jobs: List[Dict[str, Any]] = []

    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True)
        href = a["href"]
        # Only follow internal haryanajobs.in job post URLs
        if "haryanajobs.in" not in href:
            continue
        if not text or len(text) < 20:
            continue
        if not any(kw in text.lower() for kw in
                   ["recruitment", "vacancy", "bharti", "result", "admit",
                    "answer key", "notification", "recruitment"]):
            continue
        jobs.append({
            "title":         text,
            "slug":          slugify(text),
            "official_url":  href,
            "source":        "haryanajobs",
            "category":      detect_category(text),
            "qualification": detect_qualification(text),
            "state":         "haryana",
            "status":        "active",
        })

    result = _dedup(jobs)
    logger.info("scrape_haryanajobs: %d jobs", len(result))
    return result


# Haryana city/district names for location-based filtering
_HARYANA_PLACES = {
    "haryana", "hssc", "hpsc", "hkrn", "rohtak", "hisar", "karnal", "ambala",
    "gurugram", "gurgaon", "faridabad", "panipat", "sonipat", "jhajjar", "rewari",
    "jind", "kaithal", "sirsa", "bhiwani", "palwal", "nuh", "mahendragarh",
    "fatehabad", "yamunanagar", "panchkula", "kurukshetra",
}


async def scrape_sarkarinaukri() -> List[Dict[str, Any]]:
    """
    sarkarinaukri.com Haryana page — used for cross-verification.
    Selector: .td-pb-span8.td-main-content a (main content column, not sidebar).
    Page mixes Haryana-specific + all-India jobs; we store both but tag state correctly.
    """
    html = await fetch_page(SOURCES["sarkarinaukri"])
    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")
    main = soup.select_one(".td-pb-span8.td-main-content")
    if not main:
        logger.warning("scrape_sarkarinaukri: main content div not found — site may have changed")
        return []

    jobs: List[Dict[str, Any]] = []
    for a in main.find_all("a", href=True):
        raw = a.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", raw).strip()
        href = a["href"]

        if len(text) < 20:
            continue
        if "sarkarinaukri.com" not in href:
            continue
        tl = text.lower()
        if not any(kw in tl for kw in
                   ["recruitment", "vacancy", "result", "admit", "notification",
                    "interview", "selection", "post", "bharti"]):
            continue

        # Determine if this job is Haryana-specific
        is_haryana = any(place in (text + href).lower() for place in _HARYANA_PLACES)

        jobs.append({
            "title":         text,
            "slug":          slugify(text),
            "official_url":  href,
            "source":        "sarkarinaukri",
            "category":      detect_category(text),
            "qualification": detect_qualification(text),
            "state":         "haryana" if is_haryana else "all_india",
            "status":        "active",
        })

    result = _dedup(jobs)
    logger.info("scrape_sarkarinaukri: %d jobs (%d Haryana-specific)",
                len(result),
                sum(1 for j in result if j["state"] == "haryana"))
    return result


def _title_tokens(title: str) -> set:
    """Lowercase significant words from a title (3+ chars, no stopwords)."""
    stopwords = {"for", "the", "and", "in", "of", "to", "a", "an", "by",
                 "on", "at", "is", "are", "from", "with", "as", "all", "its"}
    return {w for w in re.findall(r"[a-z0-9]+", title.lower())
            if len(w) >= 3 and w not in stopwords}


def _titles_match(t1: str, t2: str, threshold: float = 0.4) -> bool:
    """True if two titles share enough significant words (Jaccard >= threshold)."""
    a, b = _title_tokens(t1), _title_tokens(t2)
    if not a or not b:
        return False
    return len(a & b) / len(a | b) >= threshold


async def cross_verify(source_jobs: List[Dict[str, Any]],
                       verify_jobs: List[Dict[str, Any]]) -> dict:
    """
    Compare two job lists by fuzzy title similarity (Jaccard word overlap).
    Exact slug match fails when sites use different title wording for the same job.
    Returns match stats — used to gauge how complete our scraping is.
    """
    matched_verify_idx: set = set()
    matched_source_idx: set = set()

    for si, sj in enumerate(source_jobs):
        for vi, vj in enumerate(verify_jobs):
            if vi in matched_verify_idx:
                continue
            if _titles_match(sj["title"], vj["title"]):
                matched_source_idx.add(si)
                matched_verify_idx.add(vi)
                break

    only_in_verify = [verify_jobs[i] for i in range(len(verify_jobs)) if i not in matched_verify_idx]
    only_in_source = [source_jobs[i] for i in range(len(source_jobs)) if i not in matched_source_idx]

    return {
        "source_count":    len(source_jobs),
        "verify_count":    len(verify_jobs),
        "matched":         len(matched_verify_idx),
        "only_in_source":  len(only_in_source),
        "only_in_verify":  len(only_in_verify),
        "only_in_verify_jobs": only_in_verify,
        "match_pct":       round(len(matched_verify_idx) / max(len(verify_jobs), 1) * 100, 1),
    }


# ---------------------------------------------------------------------------
# Central govt scrapers
# ---------------------------------------------------------------------------

def _build_job(text: str, href: str, source: str, category: str, state: str,
               base_url: str = "") -> Dict[str, Any]:
    """Shared job dict builder to avoid repeating the same fields."""
    if href and not href.startswith("http") and base_url:
        href = base_url.rstrip("/") + "/" + href.lstrip("/")
    return {
        "title":         text,
        "slug":          slugify(text),
        "official_url":  href,
        "source":        source,
        "category":      category,
        "qualification": detect_qualification(text),
        "state":         state,
        "status":        "active",
    }


def _extract_links(soup, keywords: list, min_len: int = 25,
                   require_year: bool = False) -> List[tuple]:
    """
    Extract (text, href) pairs from all <a> tags matching keyword + length filters.
    Strips Angular template strings and normalises whitespace.
    """
    out = []
    for a in soup.find_all("a", href=True):
        raw = a.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", raw).strip()
        if len(text) < min_len:
            continue
        if "{{" in text:          # Angular un-rendered template — skip
            continue
        tl = text.lower()
        if not any(kw in tl for kw in keywords):
            continue
        if require_year and not any(yr in text for yr in ("2024", "2025", "2026")):
            continue
        out.append((text, a["href"]))
    return out


_JOB_KW = ["recruit", "vacanc", "result", "admit", "notification",
            "bharti", "advt", "apply", "selection", "interview"]


async def scrape_rrb() -> List[Dict[str, Any]]:
    """
    RRB Chandigarh — representative Railway Recruitment Board.
    All RRBs publish the same centralised employment notices (CEN).
    150+ job/result/admit-card links per scrape.
    """
    html = await fetch_page(SOURCES["rrb"])
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    jobs = []
    for text, href in _extract_links(soup, _JOB_KW, min_len=30):
        # Skip pure "click here to apply" buttons — no title info
        if text.lower().startswith("click here") or text.lower().startswith("आवेदन"):
            continue
        jobs.append(_build_job(text, href, "rrb", "railway", "all_india",
                               "https://www.rrbcdg.gov.in"))
    result = _dedup(jobs)
    logger.info("scrape_rrb: %d jobs", len(result))
    return result


# ---------------------------------------------------------------------------
# North / West India PSC scrapers
# ---------------------------------------------------------------------------

async def scrape_rpsc() -> List[Dict[str, Any]]:
    """Rajasthan Public Service Commission — 88+ links per scrape."""
    html = await fetch_page(SOURCES["rpsc"])
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    jobs = [_build_job(t, h, "rpsc", "psc", "rajasthan",
                       "https://rpsc.rajasthan.gov.in")
            for t, h in _extract_links(soup, _JOB_KW)]
    result = _dedup(jobs)
    logger.info("scrape_rpsc: %d jobs", len(result))
    return result


async def scrape_jkpsc() -> List[Dict[str, Any]]:
    """Jammu & Kashmir Public Service Commission — 29+ links per scrape."""
    html = await fetch_page(SOURCES["jkpsc"])
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    jobs = [_build_job(t, h, "jkpsc", "psc", "jk",
                       "https://jkpsc.nic.in")
            for t, h in _extract_links(soup, _JOB_KW)]
    result = _dedup(jobs)
    logger.info("scrape_jkpsc: %d jobs", len(result))
    return result


async def scrape_ppsc() -> List[Dict[str, Any]]:
    """
    Punjab Public Service Commission — 455+ links per scrape.
    Largest state PSC site we've found; posts all exam/result/admit-card notices.
    Note: ppsc.gov.in had intermittent SSL errors previously — retry logic in
    fetch_page handles this. hppsc.hp.gov.in and psc.uk.gov.in are unscrapeable
    due to Python 3.11 legacy TLS renegotiation incompatibility.
    """
    html = await fetch_page(SOURCES["ppsc"])
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    jobs = [_build_job(t, h, "ppsc", "psc", "punjab",
                       "https://ppsc.gov.in")
            for t, h in _extract_links(soup, _JOB_KW)]
    result = _dedup(jobs)
    logger.info("scrape_ppsc: %d jobs", len(result))
    return result


# ---------------------------------------------------------------------------
# Hindi belt PSC scrapers
# ---------------------------------------------------------------------------

async def scrape_uppsc() -> List[Dict[str, Any]]:
    """
    Uttar Pradesh Public Service Commission.
    Site uses Angular — un-rendered {{...}} template strings are filtered out.
    """
    html = await fetch_page(SOURCES["uppsc"])
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    jobs = [_build_job(t, h, "uppsc", "psc", "uttar_pradesh",
                       "https://uppsc.up.nic.in")
            for t, h in _extract_links(soup, _JOB_KW)]
    result = _dedup(jobs)
    logger.info("scrape_uppsc: %d jobs", len(result))
    return result


async def scrape_mppsc() -> List[Dict[str, Any]]:
    """Madhya Pradesh Public Service Commission — 27+ links per scrape."""
    html = await fetch_page(SOURCES["mppsc"])
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    jobs = [_build_job(t, h, "mppsc", "psc", "madhya_pradesh",
                       "https://mppsc.mp.gov.in")
            for t, h in _extract_links(soup, _JOB_KW)]
    result = _dedup(jobs)
    logger.info("scrape_mppsc: %d jobs", len(result))
    return result


async def scrape_jpsc() -> List[Dict[str, Any]]:
    """
    Jharkhand Public Service Commission — 45+ links per scrape.
    Links often have no title text (PDF direct links); filtered by min_len.
    """
    html = await fetch_page(SOURCES["jpsc"])
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    jobs = [_build_job(t, h, "jpsc", "psc", "jharkhand",
                       "https://jpsc.gov.in")
            for t, h in _extract_links(soup, _JOB_KW)]
    result = _dedup(jobs)
    logger.info("scrape_jpsc: %d jobs", len(result))
    return result


async def scrape_bpsc() -> List[Dict[str, Any]]:
    """
    Bihar Public Service Commission.
    Old URL bpsc.bih.nic.in is dead — migrated to bpsc.bihar.gov.in.
    Scrapes /whats-new/ which has the latest 7-10 notices as plain HTML.
    """
    html = await fetch_page(SOURCES["bpsc"])
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    jobs = [_build_job(t, h, "bpsc", "psc", "bihar",
                       "https://bpsc.bihar.gov.in")
            for t, h in _extract_links(soup, _JOB_KW)]
    result = _dedup(jobs)
    logger.info("scrape_bpsc: %d jobs", len(result))
    return result


async def scrape_ibps() -> List[Dict[str, Any]]:
    """
    IBPS — banking recruitment (IBPS PO, Clerk, RRB, SO).
    Old ibps.in had SSL errors; WordPress-based site now accessible.
    Lists active bank recruitment drives including CBI, Indian Bank, co-op banks.
    """
    html = await fetch_page(SOURCES["ibps"])
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    jobs = [_build_job(t, h, "ibps", "banking", "all_india",
                       "https://www.ibps.in")
            for t, h in _extract_links(soup, _JOB_KW)]
    result = _dedup(jobs)
    logger.info("scrape_ibps: %d jobs", len(result))
    return result


# ---------------------------------------------------------------------------
# Master scrape — all sources run in parallel, all DB writes run in parallel
# ---------------------------------------------------------------------------

async def scrape_all_sources() -> int:
    """
    Run ALL scrapers concurrently, upsert all results to DB concurrently.
    Returns total jobs upserted.
    """
    from db import db_upsert_job, db_queue_alerts  # local import avoids circular

    logger.info("scrape_all_sources: starting (parallel)")

    # ── 1. Fetch all sources at the same time ────────────────────────────────
    results = await asyncio.gather(
        # Haryana
        scrape_sarkariresult_haryana(),
        scrape_hssc(),
        scrape_hpsc(),
        scrape_haryana_police(),
        scrape_haryanajobs(),
        # Central
        scrape_rrb(),
        scrape_ibps(),
        # North / West India
        scrape_rpsc(),
        scrape_jkpsc(),
        scrape_ppsc(),
        # Hindi belt
        scrape_uppsc(),
        scrape_mppsc(),
        scrape_jpsc(),
        scrape_bpsc(),
        # Cross-verification
        scrape_sarkarinaukri(),
        return_exceptions=True,
    )

    all_jobs: List[Dict[str, Any]] = []
    scraper_names = [
        "sarkariresult", "hssc", "hpsc", "haryana_police", "haryanajobs",
        "rrb", "ibps",
        "rpsc", "jkpsc", "ppsc",
        "uppsc", "mppsc", "jpsc", "bpsc",
        "sarkarinaukri",
    ]
    for name, result in zip(scraper_names, results):
        if isinstance(result, Exception):
            logger.error("Scraper %s raised: %s", name, result, exc_info=result)
        elif isinstance(result, list):
            all_jobs.extend(result)

    # Global dedup across all sources by slug
    all_jobs = _dedup(all_jobs)
    logger.info("scrape_all_sources: %d unique jobs fetched", len(all_jobs))

    # ── 2. Upsert all jobs to DB concurrently ────────────────────────────────
    async def _upsert(job: Dict[str, Any]):
        if not job.get("title") or not job.get("slug"):
            return
        try:
            job_id = await db_upsert_job(job)
            await db_queue_alerts(job_id)
        except Exception as exc:
            logger.error("db_upsert_job failed slug=%s: %s", job.get("slug"), exc)

    await asyncio.gather(*[_upsert(job) for job in all_jobs])

    logger.info("scrape_all_sources: done — %d jobs upserted", len(all_jobs))
    return len(all_jobs)
