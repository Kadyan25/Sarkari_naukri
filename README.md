# Sarkari Naukri

Govt job aggregator — scrapes 16+ sources every 30 min, stores to PostgreSQL, serves via FastAPI + Next.js. Telegram alerts in Hindi.

**Stack:** Python FastAPI · PostgreSQL · Next.js 16 · Telegram Bot  
**Repo:** https://github.com/Kadyan25/Sarkari_naukri.git

---

## Features

- 16 scrapers: HSSC, HPSC, Police, UPSC, SSC, IBPS, Railway, PPSC, RPSC and more
- Data stored permanently in PostgreSQL — scrapers only add/update, never reload
- Telegram alerts in Hindi with job details
- EN / HI language toggle + dark / light theme
- Personalised recommendations by qualification + age
- JobPosting JSON-LD schema → Google Jobs tab
- Mobile-first UI with Noto Sans Devanagari

---

## Project Structure

```
/
├── main.py           # FastAPI app + routes + lifespan
├── scraper.py        # All 16 scrapers (httpx + BS4, concurrent)
├── scheduler.py      # APScheduler: scrape every 30 min, alerts every 5 min
├── db.py             # asyncpg pool, upsert logic, alert queue
├── telegram_bot.py   # Bot commands + alert sender
├── ncs_api.py        # NCS Portal API client
├── config.py         # Env vars, SOURCES dict, random_headers()
├── verify.py         # DB verification / spot-check script
├── requirements.txt
├── Dockerfile
├── railway.toml      # Railway deploy config
└── frontend/
    ├── app/
    │   ├── page.tsx              # Homepage
    │   ├── [category]/page.tsx   # HSSC / HPSC / Police etc.
    │   ├── job/[slug]/page.tsx   # Job detail + JobPosting schema
    │   ├── admit-card/page.tsx
    │   └── result/page.tsx
    ├── components/
    │   ├── Header.tsx            # Nav + EN/HI toggle + dark mode toggle
    │   ├── Footer.tsx
    │   ├── HomeContent.tsx       # Client component for homepage
    │   ├── JobCard.tsx
    │   └── CategoryTabs.tsx
    ├── contexts/AppContext.tsx   # Language + theme state (localStorage)
    └── lib/
        ├── api.ts                # Fetch helpers with ISR revalidation
        ├── i18n.ts               # EN / HI string translations
        └── types.ts              # Job / Category TypeScript types
```

---

## How to See Actual Jobs (Local Dev)

### Step 1 — Prerequisites

- Python 3.11+
- PostgreSQL 15+ (running locally)
- Node.js 18+

### Step 2 — Create the database

```bash
# Open psql as postgres user
psql -U postgres

# Inside psql:
CREATE DATABASE sarkari_naukri;
\q
```

### Step 3 — Backend setup

```bash
# In the project root (Windows)
python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/sarkari_naukri
TELEGRAM_BOT_TOKEN=get_from_botfather
NCS_API_KEY=
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO: DB pool created, schema ready
INFO: Scheduler started
INFO: Uvicorn running on http://127.0.0.1:8000
```

### Step 4 — Trigger the first scrape

```bash
curl -X POST http://localhost:8000/api/scrape/trigger
```

Wait 10–15 seconds (scrapers run concurrently), then verify:

```bash
venv\Scripts\python verify.py
```

Expected output:
```
=======================================================
  SARKARI NAUKRI — DB VERIFICATION REPORT
=======================================================
  Total jobs        : 950+
  Active jobs       : 900+
  Missing last_date : ~50
  Duplicate slugs   : 0
✅ Job count OK

--- Category Breakdown ---
  hssc       9
  hpsc      16
  banking   12
  railway   49
  upsc      25
  ...
```

### Step 5 — Frontend

```bash
cd frontend
# Create frontend/.env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_SITE_URL=http://localhost:3000

npm install
npm run dev
```

Open **http://localhost:3000** — job cards will appear.

---

## How Data Persistence Works

> **Short answer:** The DB keeps everything. Each scrape only adds new jobs or updates changed fields on existing ones. Nothing is ever reloaded from scratch.

### The upsert pattern (`db.py: db_upsert_job`)

```sql
INSERT INTO jobs (slug, title, category, last_date, status, ...)
VALUES (...)
ON CONFLICT (slug) DO UPDATE SET
    title         = EXCLUDED.title,
    category      = EXCLUDED.category,
    qualification = EXCLUDED.qualification,
    last_date     = EXCLUDED.last_date,
    status        = EXCLUDED.status,
    updated_at    = NOW()
```

- **New job found** → inserted fresh with all fields
- **Same job seen again** (same slug) → only `title`, `category`, `qualification`, `last_date`, `status`, `updated_at` are refreshed. Everything else (`salary`, `official_url`, `total_posts` etc.) is preserved from the original insert.
- **Job disappears from source** → stays in DB as `status = 'active'` until you manually expire it or until it's past `last_date`

### Scheduler cadence

| Job | Interval | What it does |
|-----|----------|-------------|
| `scrape_all_sources` | Every 30 min | Hits all 16 sources, upserts new/changed jobs |
| `send_pending_alerts` | Every 5 min | Sends queued Telegram alerts to subscribers |

The scraper never drops or replaces the DB. Over time the DB accumulates all jobs seen. The frontend always reads from DB — it never triggers scraping directly.

---

## API Reference

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/api/health` | — | Health check |
| GET | `/api/jobs` | `category`, `qualification`, `status`, `page`, `limit` | List jobs with filters |
| GET | `/api/jobs/recommend` | `qualification`, `age`, `category` | Personalised recommendations |
| GET | `/api/jobs/{slug}` | — | Single job detail |
| POST | `/api/scrape/trigger` | — | Manually trigger a full scrape |
| POST | `/api/subscribe/telegram` | `telegram_id`, `categories`, `qualification` | Subscribe to alerts |
| DELETE | `/api/subscribe/telegram/{id}` | — | Unsubscribe |

### Quick curl tests

```bash
# Health
curl http://localhost:8000/api/health

# All active jobs (page 1)
curl "http://localhost:8000/api/jobs"

# Filter by category
curl "http://localhost:8000/api/jobs?category=hssc"
curl "http://localhost:8000/api/jobs?category=banking"

# Filter by qualification
curl "http://localhost:8000/api/jobs?qualification=graduate"

# Job by slug
curl "http://localhost:8000/api/jobs/hssc-clerk-recruitment-2025"

# Recommendations for a 24-year-old graduate
curl "http://localhost:8000/api/jobs/recommend?qualification=graduate&age=24"
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@localhost:5432/sarkari_naukri` |
| `TELEGRAM_BOT_TOKEN` | ✅ | From [@BotFather](https://t.me/BotFather) — skip if not testing bot |
| `NCS_API_KEY` | optional | NCS Portal API — register at ncs.gov.in |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:8000` for local dev |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `http://localhost:3000` for local dev |
| `NEXT_PUBLIC_ADSENSE_ID` | optional | Google AdSense publisher ID |

---

## Active Scrapers

| Source | Scope | Avg Jobs |
|--------|-------|----------|
| hssc.gov.in | Haryana | ~9 |
| hpsc.gov.in | Haryana | ~16 |
| haryanapolice.gov.in | Haryana | 0 (listings via HSSC) |
| haryanajobs.in | All-India | ~73 |
| bseh.org.in (HTET) | Haryana | ~28 |
| rrbcdg.gov.in (RRB) | Central | ~49 |
| ibps.in | Central | ~12 |
| upsc.gov.in | Central | ~25 |
| ugcnet.nta.ac.in | Central | ~30 |
| ppsc.gov.in | Punjab | ~334 |
| rpsc.rajasthan.gov.in | Rajasthan | ~132 |
| jpsc.gov.in | Jharkhand | ~51 |
| jkpsc.nic.in | J&K | ~93 |
| psc.uk.gov.in (UKPSC) | Uttarakhand | ~43 |
| uppsc.up.nic.in | UP | ~34 |
| mppsc.mp.gov.in | MP | ~25 |
| sarkariresult.com/haryana/ | Haryana | ~30 (works on Indian server) |

**Total: ~950+ jobs per scrape**

---

## Deploy

### Backend → Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Add PostgreSQL plugin → `DATABASE_URL` set automatically
3. Add env vars: `TELEGRAM_BOT_TOKEN`
4. Railway picks up `Dockerfile` + `railway.toml` automatically
5. After deploy, run: `POST /api/scrape/trigger` to seed the DB

### Frontend → Vercel

1. [vercel.com](https://vercel.com) → New Project → Import repo
2. **Root Directory:** `frontend/`
3. Add env vars: `NEXT_PUBLIC_API_URL` (Railway URL), `NEXT_PUBLIC_SITE_URL`
4. Deploy — `vercel.json` sets region to Mumbai (bom1)
5. Submit sitemap to Google Search Console: `https://yourdomain.in/sitemap.xml`

---

## Common Issues

**`asyncpg.exceptions.InvalidCatalogNameError` on startup**  
→ Database doesn't exist. Run `CREATE DATABASE sarkari_naukri;` in psql first.

**`TELEGRAM_BOT_TOKEN` error on startup**  
→ Add a dummy value in `.env` if not testing the bot: `TELEGRAM_BOT_TOKEN=skip`  
→ Or comment out `init_bot()` in `main.py` lifespan temporarily.

**0 jobs after scrape**  
→ Run `python verify.py`. Check terminal logs for scraper errors.  
→ Some sites are geo-filtered (sarkariresult.com) — will work on Railway.

**Frontend shows "Could not load data"**  
→ Backend not running, or `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is wrong.  
→ Check: `curl http://localhost:8000/api/health`

**SarkariResult returns 0 jobs locally**  
→ Known issue — geo-filtered for non-Indian IPs. Works correctly on Railway (Indian server).

**SSL errors for UKPSC / HPPSC**  
→ Fixed via legacy TLS client in `scraper.py`. If re-appears, see ISSUE-006 in `issues.md`.
