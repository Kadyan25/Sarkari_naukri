# Haryana Sarkari Naukri

Govt job notification aggregator for Haryana aspirants — like SarkariResult.com with personalization, Telegram alerts, and Google Jobs integration.

**Stack:** Python FastAPI · PostgreSQL · Next.js 14 · Telegram Bot

---

## Features

- Scrapes HSSC, HPSC, Haryana Police, SarkariResult, hreyajna automatically every 30 min
- Telegram alerts in Hindi when new jobs are posted
- Personalised job recommendations by qualification + age
- JobPosting JSON-LD schema on every job page (Google Jobs tab)
- Admit card + result pages for high-traffic SEO keywords
- Mobile-first UI with Hindi (Devanagari) support

---

## Project Structure

```
haryana-naukri/
├── main.py          # FastAPI app + lifespan
├── scraper.py       # Concurrent job scrapers (httpx + BS4)
├── scheduler.py     # APScheduler — scrape every 30 min, alerts every 5 min
├── db.py            # asyncpg PostgreSQL helpers
├── telegram_bot.py  # Telegram bot + alert sender
├── ncs_api.py       # NCS Portal API client
├── config.py        # Env vars, source URLs, random_headers()
├── verify.py        # Data verification script
├── requirements.txt
├── Dockerfile
├── railway.toml
├── .env.example
└── frontend/
    └── app/
        ├── page.tsx              # Homepage — job list + category tabs
        ├── [category]/page.tsx   # HSSC / HPSC / Police etc.
        ├── job/[slug]/page.tsx   # Job detail + JobPosting schema
        ├── admit-card/page.tsx   # Admit card page
        ├── result/page.tsx       # Result page
        ├── sitemap.ts            # Auto-generated sitemap
        └── robots.ts             # robots.txt
```

---

## Local Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Node.js 18+
- Telegram bot token from [@BotFather](https://t.me/BotFather)

### 1. Clone & configure

```bash
git clone https://github.com/Kadyan25/Sarkari_naukri.git
cd Sarkari_naukri

# Backend env
cp .env.example .env
# Fill in DATABASE_URL and TELEGRAM_BOT_TOKEN in .env

# Frontend env
cp frontend/.env.example frontend/.env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000 in frontend/.env.local
```

### 2. Backend

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

# Create the database
psql -U postgres -c "CREATE DATABASE haryana_naukri;"

uvicorn main:app --reload --port 8000
```

Server runs at **http://localhost:8000**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## Testing

### 1. Health check

```bash
curl http://localhost:8000/api/health
# Expected: {"status":"ok","service":"haryana-naukri-api"}
```

### 2. Trigger first scrape

```bash
curl -X POST http://localhost:8000/api/scrape/trigger
```

Wait 5–10 seconds then verify:

```bash
python verify.py
```

Expected output:
```
=======================================================
  HARYANA NAUKRI — DB VERIFICATION REPORT
=======================================================
  Total jobs      : 45
  Haryana jobs    : 45
  Active jobs     : 40
  Missing last_date : 3
  Duplicate slugs   : 0
✅ Job count OK (45 jobs)

--- Category Breakdown ---
  hssc            18
  police           8
  hpsc             7
```

### 3. Test API endpoints

```bash
# All active jobs
curl "http://localhost:8000/api/jobs"

# Filter by category
curl "http://localhost:8000/api/jobs?category=hssc"

# Filter by qualification
curl "http://localhost:8000/api/jobs?qualification=graduate"

# Single job by slug
curl "http://localhost:8000/api/jobs/hssc-clerk-recruitment-2025"

# Personalised recommendations
curl "http://localhost:8000/api/jobs/recommend?qualification=graduate&age=25"
```

### 4. Test Telegram Bot

1. Open your bot in Telegram
2. `/start` — welcome message in Hindi
3. `/jobs` — 5 latest Haryana jobs with links
4. `/subscribe` — inline keyboard: qualification → age → category
5. `/recommend` — jobs matching your saved profile
6. `/stop` — unsubscribe

### 5. Test Frontend

Open **http://localhost:3000** and check:

- [ ] Homepage loads with job cards
- [ ] Category tabs (HSSC / Police / Banking etc.) filter correctly
- [ ] Clicking a job opens the detail page with countdown timer
- [ ] `/admit-card` and `/result` pages load
- [ ] `/sitemap.xml` returns XML listing all job URLs
- [ ] `/robots.txt` is accessible
- [ ] Looks correct on 360px screen width (mobile)

---

## API Reference

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/api/health` | — | Health check |
| GET | `/api/jobs` | `category`, `qualification`, `status`, `page`, `limit` | List jobs |
| GET | `/api/jobs/recommend` | `qualification`, `age`, `category` | Personalised jobs |
| GET | `/api/jobs/{slug}` | — | Single job detail |
| POST | `/api/subscribe/telegram` | `telegram_id`, `categories`, `qualification` | Subscribe |
| DELETE | `/api/subscribe/telegram/{id}` | — | Unsubscribe |
| POST | `/api/scrape/trigger` | — | Manual scrape trigger |

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/haryana_naukri` |
| `TELEGRAM_BOT_TOKEN` | ✅ | From @BotFather |
| `NCS_API_KEY` | ⬜ | NCS Portal — register at ncs.gov.in |
| `PAGESPEED_API_KEY` | ⬜ | Optional |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend URL e.g. `http://localhost:8000` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Your domain e.g. `https://yourdomain.in` |
| `NEXT_PUBLIC_ADSENSE_ID` | ⬜ | Google AdSense publisher ID |

---

## Deploy

### Backend → Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Add PostgreSQL plugin — `DATABASE_URL` is set automatically
3. Add env vars: `TELEGRAM_BOT_TOKEN`, `NCS_API_KEY`
4. Railway picks up `railway.toml` + `Dockerfile` automatically
5. After deploy: `POST /api/scrape/trigger` to seed the database

### Frontend → Vercel

1. [vercel.com](https://vercel.com) → New Project → Import repo
2. Set **Root Directory** to `frontend/`
3. Add env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADSENSE_ID`
4. Deploy — `vercel.json` is picked up automatically
5. Submit `https://yourdomain.in/sitemap.xml` to Google Search Console

---

## Data Sources

| Source | Type | What it scrapes |
|--------|------|----------------|
| SarkariResult /haryana/ | Scrape | Aggregated Haryana jobs — fastest source |
| hssc.gov.in | Scrape | HSSC official recruitments |
| hpsc.gov.in | Scrape | HPSC official recruitments |
| haryanapolicerecruitment.gov.in | Scrape | Police recruitments |
| hreyajna.gov.in | Scrape | Haryana rojgar portal |
| ncs.gov.in API | API | Official govt jobs (requires API key) |

All sources run concurrently every 30 minutes via APScheduler.

---

## Common Issues

**asyncpg connection error on startup**
Check `DATABASE_URL` in `.env` and confirm PostgreSQL is running.

**Telegram bot not responding**
Check `TELEGRAM_BOT_TOKEN` is set correctly. Only one bot instance can poll at a time.

**0 jobs after scrape**
Run `python verify.py`. Check logs for scraper errors. Confirm network access to govt sites.

**Frontend shows empty job list**
Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local` points to the running backend.
