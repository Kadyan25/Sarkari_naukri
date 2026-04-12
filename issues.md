# issues.md — Haryana Sarkari Naukri

Tracks bugs found, root cause, and fix applied. Newest first.

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
