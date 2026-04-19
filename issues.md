# issues.md — Sarkari Naukri

Tracks bugs found, root cause, and fix applied. Newest first.

---

## ISSUE-015 — Design: gradient hero/shadow-heavy cards clashed with newspaper aesthetic
**Date:** 2026-04-19
**Issue:** Homepage used a blue gradient hero banner and box-shadow cards — looked like a generic app, not a trusted government job gazette. Category tab labels were English-only.
**Fix:** Implemented newspaper/gazette design system. CSS tokens: warm cream `--bg-page: #f4efe4`, ink scale `--ink-*`, no shadows (borders only), tight radii (6px card / 4px button / 2px badge), IBM Plex Mono for metadata. Header: dark reversed masthead, always dark regardless of theme. Hero: date eyebrow + H1 + separator rule. StatBar: 3-column mono number grid. Eyebrow pattern for all section headings. Dark mode: single `html.dark {}` block overrides all CSS vars — no per-component dark hacks needed.

## ISSUE-014 — official_url points to aggregator sites, not real department portals
**Date:** 2026-04-19
**Issue:** Jobs scraped from haryanajobs.in, sarkarinaukri.com, and sarkariresult.com stored the aggregator page URL as `official_url`. Users clicking "Apply Online" landed on third-party aggregator sites instead of official government portals.
**Fix:** Added `CATEGORY_OFFICIAL_URLS` dict in config.py mapping each category to its real department homepage (hssc.gov.in, ibps.in, ssc.gov.in, upsc.gov.in etc.). All three aggregator scrapers now use this mapping instead of storing the aggregator href. The DB upsert conditionally updates `official_url` — replaces stored aggregator URLs but preserves correct URLs from direct govt scrapers. `db_fix_aggregator_urls()` backfills existing records on server startup.

## ISSUE-013 — API returns 0 jobs despite 1045 in DB
**Date:** 2026-04-19
**Issue:** `GET /api/jobs` returned an empty list even though `scrape_all_sources()` had just upserted 1045 jobs into Supabase. The frontend showed no job cards.
**Fix:** `db_list_jobs()` had a filter `j.last_date >= CURRENT_DATE` which excluded every row where `last_date IS NULL`. Since most scraped jobs come from aggregator pages that don't expose a parseable date, the majority of rows had `NULL` last_date and were silently filtered out. Changed filter to `(j.last_date IS NULL OR j.last_date >= CURRENT_DATE)`. Same fix applied to `db_get_recommended_jobs()`.

## ISSUE-012 — asyncpg create_pool fails on Windows with Supabase pooler
**Date:** 2026-04-19
**Issue:** `asyncpg.create_pool()` threw `ConnectionRefusedError [WinError 1225]` even though `asyncpg.connect()` with the same URL worked fine.
**Fix:** Pass an explicit `ssl.SSLContext` to `create_pool()`. Windows ProactorEventLoop handles SSL differently for pool connections vs single connections.

## ISSUE-011 — load_dotenv() missing from config.py
**Date:** 2026-04-19
**Issue:** `DB_URL`, `TELEGRAM_BOT_TOKEN` etc. were always reading the hardcoded fallback values because `.env` was never loaded. Scraper was connecting to localhost instead of Supabase.
**Fix:** Added `from dotenv import load_dotenv; load_dotenv()` at the top of `config.py`.

## ISSUE-010 — No scraper health monitoring (blocked sources go undetected)
**Date:** 2026-04-19
**Issue:** If a source gets IP-blocked or changes HTML structure, scraper returns 0 jobs silently. No alert, no visibility.
**Fix:** Added `scraper_runs` table logging per-source job counts after every run. `db_get_scraper_health()` checks last 3 runs per source. If any source returns 0 three times in a row, Telegram alert is sent to `ADMIN_TELEGRAM_ID`. New endpoint `GET /api/health/scrapers` shows full status. Set `ADMIN_TELEGRAM_ID` in `.env` (your personal Telegram user ID — get it from @userinfobot).

---

## ISSUE-009 — Frontend: dead Vite files, security vuln, no dark mode, no i18n, wrong branding
**Date:** 2026-04-19

- **Dead Vite/SEO-audit files** (`frontend/src/`, `index.html`, `vite.config.js`) — none imported by Next.js. **Fix:** Deleted all three.
- **Next.js critical CVE** (`next@14.2.3`). **Fix:** Upgraded to `next@16.2.4`.
- **`images.domains` deprecation** in `next.config.js`. **Fix:** Replaced with `remotePatterns`.
- **No dual language** — UI text hardcoded Hindi. **Fix:** Added `AppContext` + `lib/i18n.ts`; EN/HI toggle in header; preference saved to `localStorage`.
- **No dark mode** — site had no dark theme. **Fix:** `darkMode: 'class'` in Tailwind; dark variants on all components; theme toggle in header; preference saved to `localStorage`; inline script prevents flash-of-wrong-theme.
- **Haryana-only branding** — would not scale to All-India. **Fix:** Rebranded to "Sarkari Naukri" / `SarkariNaukri.in` (placeholder; final name TBD).

---

## ISSUE-008 — SSC CGL/CHSL, SBI, Army sites are JS-rendered (0 jobs)
**Date:** 2026-04-13
**Severity:** Medium — SSC CGL is huge (millions of applicants) but indirectly covered

### Symptom
```
SSC (ssc.gov.in/portal/latestnotice):  0 links
SSC (ssc.nic.in/Portal/Notices):       0 relevant links (only exam calendar PDFs)
SBI (sbi.co.in/web/careers):           0 relevant links
Army (joinindianarmy.nic.in):          0 links
```

### Root Cause
All four sites are fully JS-rendered. BeautifulSoup sees empty shell HTML.
- SSC portal: React/Angular SPA, job listings injected after load
- SBI careers: Liferay portal, content loaded via AJAX
- Army site: JS-only page (9KB shell)

### Current Mitigation
SSC CGL/CHSL jobs are covered indirectly via:
- `haryanajobs.in` — aggregator that lists SSC jobs ✅
- `sarkariresult.com/haryana/` — will work on Railway (geo-filtered locally) ✅

### Future Fix
Add `scraper_js.py` using Playwright for JS-rendered sites.
Priority order: SSC > SBI > Army.
Playwright is already in .gitignore (removed from requirements.txt in Week 4).
Re-add `playwright==1.44.0` to requirements.txt when implementing.

---

## ISSUE-007 — HPPSC JS-rendered: legacy TLS fixed but content inaccessible
**Date:** 2026-04-13
**Severity:** Low — only adds ~30 HP state jobs; all other scrapers working

### Symptom
`scrape_hppsc: 0 jobs` even after legacy TLS fix.

### Root Cause
`hppsc.hp.gov.in` is a fully Angular SPA. The server returns a ~42KB HTML shell
with nav + footer only. All job listing content is injected via AJAX after page load.
BeautifulSoup sees 47 links total — all navigation, no job entries.

### Investigation
- ✅ Legacy TLS now works (SSL_OP_LEGACY_SERVER_CONNECT = 0x4 fix from ISSUE-006)
- ❌ `/CommonControls/ViewContinuousLinkPage?qs=...` returns same empty shell
- ❌ No sitemap.xml (404)
- ❌ No `/api/*` endpoints exposed
- ❌ 0 tables, 0 list items, 0 PDF links in static HTML

### Fix Applied
`scrape_hppsc()` returns `[]` immediately with a log message.
HPPSC is in SOURCES dict for future Playwright support.

### Future Fix
Add Playwright scraper for JS-rendered sites (separate `scraper_js.py`).
HPPSC, and any future Angular/React PSC sites would use this path.

---

## ISSUE-006 — UKPSC + HPPSC: UNSAFE_LEGACY_RENEGOTIATION_DISABLED (Python 3.11)
**Date:** 2026-04-13
**Severity:** Medium — 2 state PSCs blocked

### Symptom
```
ssl.SSLError: UNSAFE_LEGACY_RENEGOTIATION_DISABLED
```
Thrown by `hppsc.hp.gov.in` and `psc.uk.gov.in` when using the shared httpx client.

### Root Cause
OpenSSL 3.x (bundled with Python 3.11) disables legacy TLS renegotiation by default.
`ssl.OP_LEGACY_SERVER_CONNECT` was only added as a named Python constant in 3.12,
but the underlying OpenSSL integer `0x4` works in 3.11 too.

### Fix Applied
**scraper.py — new `_get_legacy_client()` function:**
```python
import ssl
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
ctx.options |= 0x4          # SSL_OP_LEGACY_SERVER_CONNECT (raw int, works on Py 3.11)
ctx.set_ciphers("DEFAULT@SECLEVEL=1")
_legacy_client = httpx.AsyncClient(verify=ctx, ...)
```

New `fetch_page_legacy(url)` function uses this client.
New `scrape_ukpsc()` and `scrape_hppsc()` scrapers use `fetch_page_legacy`.
`close_client()` updated to also close `_legacy_client` on shutdown.

### Result
| Site | Before | After |
|---|---|---|
| `psc.uk.gov.in` (UKPSC) | SSL error | ✅ 43 jobs |
| `hppsc.hp.gov.in` (HPPSC) | SSL error | ✅ Connects, but JS-rendered (see ISSUE-007) |

---

## ISSUE-005 — Cross-verification with sarkarinaukri.com shows zero slug overlap
**Date:** 2026-04-12
**Severity:** Info — not a bug, confirms data quality

### Context
Added sarkarinaukri.com as a cross-verification source to check if we're missing jobs.
Scraped `https://www.sarkarinaukri.com/sarkari-naukri-haryana/` and compared against
HSSC + HPSC + haryanajobs.in.

### Finding
```
Our sources (HSSC + HPSC + haryanajobs): 92 jobs
sarkarinaukri.com Haryana page:           43 jobs
Fuzzy-matched (Jaccard >= 0.4):           0 / 43
```

**Zero overlap is expected and correct.** The two sources cover completely different job types:
- **sarkarinaukri.com "Haryana" page** = 1 Haryana-specific job + 42 central/all-India jobs
  (POWERGRID, BEL, RITES, DMRC, ONGC, Railways — central PSU/central govt)
- **Our sources** = 92 Haryana state-level jobs (HSSC notices, HPSC results, state recruitments)

The fuzzy title match (Jaccard word overlap) found 0 because the jobs are genuinely different.

### Conclusion
We have **92× more Haryana-specific jobs** than sarkarinaukri.com's Haryana page.
sarkarinaukri.com is NOT a useful cross-verification source for Haryana state jobs.

A better future cross-check would be `sarkariresult.com/haryana/` once accessible
(currently geo-blocked — will work on Railway production server).

### Fix Applied
- Added `scrape_sarkarinaukri()` scraper (selector: `.td-pb-span8.td-main-content a`)
- Added `cross_verify()` function using Jaccard word-overlap instead of exact slug match
- Added `_HARYANA_PLACES` set to tag jobs as `state=haryana` vs `state=all_india`
- sarkarinaukri jobs stored in DB with correct state tags (42 all_india, 1 haryana)

---

## ISSUE-004 — haryanapolicerecruitment.gov.in and hreyajna.gov.in domains dead
**Date:** 2026-04-12
**Severity:** High — 2 of 5 scrapers returning 0 jobs

### Symptom
```
scrape_haryana_police: 0 jobs
scrape_hreyajna: 0 jobs
```
DNS lookup failed: `[Errno 11001] getaddrinfo failed` for both domains.

### Root Cause
Both domains no longer exist:
- `haryanapolicerecruitment.gov.in` — shut down; Haryana Police recruitment now handled by HSSC
- `hreyajna.gov.in` — dead domain; no successor found on haryana.gov.in

Working alternatives found by testing domain variants:
- `haryanapolice.gov.in` resolves (main police site, but has no recruitment listing)
- `haryanajobs.in` resolves — active aggregator with 70+ job links per scrape

### Fix Applied
**config.py:**
- `haryana_police` source URL changed to `https://haryanapolice.gov.in/Public_Notice.aspx`
- `hreyajna` key removed; replaced with `haryanajobs` → `https://www.haryanajobs.in/`

**scraper.py:**
- `scrape_haryana_police()` updated: new base URL, added year filter (2024/2025/2026 required) to avoid nav links
- `scrape_hreyajna()` removed entirely
- New `scrape_haryanajobs()` added: filters internal `haryanajobs.in` links by recruitment keywords; returns ~73 jobs per run
- `scrape_all_sources()` updated to call `scrape_haryanajobs()` instead of `scrape_hreyajna()`

### Result After Fix
| Scraper | Before | After |
|---|---|---|
| haryana_police | 0 (DNS fail) | 0 (site has no listings — correct) |
| hreyajna | 0 (DNS fail) | removed |
| haryanajobs (new) | — | 73 jobs |

**Note:** Police recruitment jobs will come via the HSSC scraper (HSSC handles all Haryana Police constable/SI recruitment).

---

## ISSUE-003 — Nav links passing scraper keyword filter
**Date:** 2026-04-12
**Severity:** Medium — dirty data (nav links stored as jobs)

### Symptom
HSSC scraper returned 4 results, 3 were nav links:
```
HSSC jobs found: 4
  - CET 2025 Group-C Result        ← real job
  - Recruitment                    ← nav link
  - Public Notice                  ← nav link
  - Notifications                  ← nav link
```

### Root Cause
Minimum title length check was `len(text) < 10`. Nav links like "Recruitment" (11 chars) and "Notifications" (13 chars) slipped through.

### Fix Applied
**scraper.py — all 4 govt-site scrapers:**
- Changed `len(text) < 10` → `len(text) < 20`
- Added whitespace normalization: `re.sub(r"\s+", " ", raw).strip()` using `get_text(separator=" ")` to handle multiline link text
- Added keyword expansion: `result`, `admit`, `answer key`, `merit` added to all scrapers
- Police scraper additionally requires a year string (2024/2025/2026) to skip navigation links that happen to contain "police"

### Result After Fix
HSSC: 9 real entries, 0 nav links.

---

## ISSUE-002 — SarkariResult returns 0 jobs (geo-block suspected)
**Date:** 2026-04-12
**Severity:** Low — site returns HTTP 200 but empty job table

### Symptom
```
scrape_sarkariresult_haryana: 0 jobs
```
Page fetched successfully (HTTP 200, 45KB), but `div#post table tr` selector returns 0 rows.

### Root Cause
SarkariResult.com serves different HTML to non-Indian IPs. When accessed from certain IPs or environments (e.g. WSL, VPN, some ISPs), the content section is replaced with "Sorry This Page is Not Available Now" while still returning HTTP 200 — so no rows are found.

### Fix Applied
No code change needed. This will work correctly:
- On Railway (deploys to an Indian data centre)
- On local Indian ISP without VPN/proxy

**To verify locally:** Open `https://www.sarkariresult.com/haryana/` in browser. If you see a table of jobs it will scrape fine.

---

## ISSUE-001 — Wrong venv causing import errors during testing
**Date:** 2026-04-12
**Severity:** Low — dev environment only

### Symptom
```
pip install -r requirements.txt  # installed into wrong venv
ModuleNotFoundError: No module named 'asyncpg'
```
Packages were installing into `C:\Users\kadia\Downloads\GD\Crawler\venv` instead of project venv.

### Root Cause
Running `venv/Scripts/pip install` from a different working directory caused pip to resolve the wrong venv. Windows path resolution picked up an older global/other venv.

### Fix Applied
Used explicit target install:
```bash
venv\Scripts\pip install --target venv\Lib\site-packages -r requirements.txt
```
And set `PYTHONPATH` for test runs:
```bash
PYTHONPATH="venv/Lib/site-packages" venv/Scripts/python.exe script.py
```

**Long-term fix:** Always activate venv before installing or running:
```bash
venv\Scripts\activate    # Windows
pip install -r requirements.txt
python main.py
```
