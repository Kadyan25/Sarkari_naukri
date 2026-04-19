import os
from typing import Dict
from dotenv import load_dotenv

load_dotenv()

_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

# Tried in order — first 200 response wins
_SITEMAP_PATHS = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/wp-sitemap.xml",
    "/news-sitemap.xml",
]

# Keys that must exist in every crawl_summary (used to build empty fallback)
SUMMARY_KEYS = [
    "total_pages", "status_2xx", "status_3xx", "status_4xx", "status_5xx",
    "redirect_chains", "missing_titles", "long_titles", "titles_too_short",
    "no_meta_desc", "meta_desc_too_long", "meta_desc_too_short",
    "no_h1", "multi_h1", "noindex_pages",
    "images_missing_alt_total", "pages_with_missing_alt",
    "pages_without_og", "pages_without_twitter",
    "pages_with_mixed_content", "pages_not_https",
    "slow_server_response", "avg_response_time_ms", "avg_page_size_kb",
    "pages_with_schema", "thin_content_pages", "orphan_pages_count",
    "urls_with_uppercase", "urls_too_long", "urls_with_underscores",
    "urls_with_special_chars", "trailing_slash_issues_count",
    "broken_external_links_count",
    "pages_with_hreflang", "canonical_issues_count",
]

PAGESPEED_API_KEY = os.getenv("PAGESPEED_API_KEY", "")

# --- Sarkari Naukri job site config ---

DB_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/haryana_naukri")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
NCS_API_KEY = os.getenv("NCS_API_KEY", "")
ADMIN_TELEGRAM_ID = os.getenv("ADMIN_TELEGRAM_ID", "")  # Your personal Telegram user ID
NCS_API_BASE = "https://www.ncs.gov.in/api"

AGGREGATOR_SOURCES = {"haryanajobs", "sarkarinaukri", "sarkariresult"}

# (keywords_in_title, official_url) — checked before CATEGORY_OFFICIAL_URLS fallback.
# Org detection takes priority so e.g. "HPCRA Teacher" links to HP site, not BSEH.
ORG_URL_OVERRIDES: list[tuple[list[str], str]] = [
    (["hpcra", "hp rajya chayan", "himachal pradesh rajya chayan"], "https://hprecruit.hp.gov.in/"),
    (["hppsc", "hp public service commission"],                     "https://hppsc.hp.gov.in/"),
    (["rpsc", "rajasthan public service"],                          "https://rpsc.rajasthan.gov.in/"),
    (["jkpsc", "j&k public service", "jammu kashmir psc"],         "https://jkpsc.nic.in/"),
    (["ppsc", "punjab public service"],                             "https://ppsc.gov.in/"),
    (["ukpsc", "uttarakhand public service"],                       "https://psc.uk.gov.in/"),
    (["uppsc", "uttar pradesh public service"],                     "https://uppsc.up.nic.in/"),
    (["mppsc", "madhya pradesh public service"],                    "https://mppsc.mp.gov.in/"),
    (["jpsc", "jharkhand public service"],                          "https://jpsc.gov.in/"),
    (["bpsc", "bihar public service"],                              "https://bpsc.bihar.gov.in/"),
    (["ibps"],                                                       "https://www.ibps.in/"),
    (["sbi po", "sbi clerk", "sbi so", "sbi apprentice"],          "https://sbi.co.in/web/careers"),
    (["rrb ", "railway recruitment board"],                         "https://indianrailways.gov.in/"),
    (["upsc", "union public service"],                              "https://upsc.gov.in/"),
    (["ssc cgl", "ssc chsl", "ssc mts", "ssc gd", "ssc je"],       "https://ssc.gov.in/"),
    (["ugc-net", "ugc net", "nta net", "jrf"],                      "https://ugcnet.nta.ac.in/"),
    (["csir-net", "csir net"],                                       "https://csirnet.nta.ac.in/"),
    (["htet", "haryana teacher eligibility"],                       "https://bseh.org.in/home"),
    (["hssc"],                                                       "https://hssc.gov.in/"),
    (["hpsc", "haryana public service"],                            "https://hpsc.gov.in/"),
]

# Maps detected category → official department homepage.
# Used by aggregator scrapers so users are never linked to third-party aggregator sites.
CATEGORY_OFFICIAL_URLS: Dict[str, str] = {
    "hssc":    "https://hssc.gov.in/",
    "hpsc":    "https://hpsc.gov.in/",
    "police":  "https://haryanapolice.gov.in/",
    "patwari": "https://hssc.gov.in/",          # Patwari recruitment is via HSSC in Haryana
    "teacher": "https://bseh.org.in/home",       # HTET / BSEH
    "banking": "https://www.ibps.in/",
    "railway": "https://indianrailways.gov.in/",
    "ssc":     "https://ssc.gov.in/",
    "upsc":    "https://upsc.gov.in/",
    "net_jrf": "https://ugcnet.nta.ac.in/",
    "defence": "https://joinindianarmy.nic.in/",
    "psc":     "https://upsc.gov.in/",           # generic PSC fallback
    "other":   "https://india.gov.in/",
}

SOURCES = {
    # ── HARYANA ──────────────────────────────────────────────────────────────
    "hssc":           "https://hssc.gov.in/",
    "hpsc":           "https://hpsc.gov.in/",
    "haryana_police": "https://haryanapolice.gov.in/Public_Notice.aspx",
    "haryanajobs":    "https://www.haryanajobs.in/",
    # ── CENTRAL GOVT ─────────────────────────────────────────────────────────
    "rrb":            "https://www.rrbcdg.gov.in/",         # Railway — 150+ active notices
    # ssc.gov.in JS-rendered (0 links); ibps.in SSL error — both covered via haryanajobs.in
    # ── NORTH / WEST INDIA ───────────────────────────────────────────────────
    "rpsc":           "https://rpsc.rajasthan.gov.in/",     # Rajasthan PSC
    "jkpsc":          "https://jkpsc.nic.in/",              # J&K PSC
    "ppsc":           "https://ppsc.gov.in/",               # Punjab PSC — 455 links
    "hppsc":          "https://hppsc.hp.gov.in/",           # Himachal Pradesh PSC (legacy TLS)
    "ukpsc":          "https://psc.uk.gov.in/",             # Uttarakhand PSC (legacy TLS)
    # ── HINDI BELT ───────────────────────────────────────────────────────────
    "uppsc":          "https://uppsc.up.nic.in/",           # Uttar Pradesh PSC
    "mppsc":          "https://mppsc.mp.gov.in/",           # Madhya Pradesh PSC
    "jpsc":           "https://jpsc.gov.in/",               # Jharkhand PSC
    "bpsc":           "https://bpsc.bihar.gov.in/whats-new/", # Bihar PSC (old bpsc.bih.nic.in dead)
    # ── CENTRAL EXAM BODIES ──────────────────────────────────────────────────
    "upsc":           "https://upsc.gov.in/",               # UPSC Civil Services, NDA, CDS, CAPF
    "nta_net":        "https://ugcnet.nta.ac.in/",          # UGC-NET / JRF
    "nta_csir":       "https://csirnet.nta.ac.in/",         # CSIR-NET (science graduates)
    # ── CENTRAL BANKING ──────────────────────────────────────────────────────
    "ibps":           "https://www.ibps.in/",               # IBPS banking recruitment
    # ── HARYANA TEACHER ELIGIBILITY ──────────────────────────────────────────
    "htet":           "https://bseh.org.in/home",           # HTET Level 1/2/3 (BSEH Haryana)
    # ── AGGREGATORS ──────────────────────────────────────────────────────────
    "sarkariresult_hr": "https://www.sarkariresult.com/haryana/",
    "sarkarinaukri":    "https://www.sarkarinaukri.com/sarkari-naukri-haryana/",
}


def random_headers(ua: str) -> Dict[str, str]:
    return {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }
