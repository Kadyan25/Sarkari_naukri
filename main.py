"""
main.py — Haryana Sarkari Naukri FastAPI app.
Adapted from audit tool main.py: keeps FastAPI lifespan + CORS pattern.
All audit routes replaced with job site API routes.
"""
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from db import (
    close_db, db_get_job_by_slug, db_get_or_create_user,
    db_get_recommended_jobs, db_list_jobs, db_subscribe, db_update_user,
    init_db,
)
from scraper import close_client
from scheduler import start_scheduler, stop_scheduler
from telegram_bot import init_bot, stop_bot

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("DB initialised")
    await init_bot()
    start_scheduler()
    yield
    stop_scheduler()
    await stop_bot()
    await close_client()
    await close_db()
    logger.info("Shutdown complete")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="Haryana Sarkari Naukri API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.in"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes — Jobs
# ---------------------------------------------------------------------------

@app.get("/api/jobs")
async def get_jobs(
    category:      Optional[str] = Query(None, description="hssc|hpsc|police|banking|railway|ssc|other"),
    qualification: Optional[str] = Query(None, description="10th|12th|graduate|postgraduate|any"),
    status:        str            = Query("active", description="active|expired|result_out|admit_card"),
    page:          int            = Query(1, ge=1),
    limit:         int            = Query(20, ge=1, le=100),
):
    """List jobs with optional filters. Sorted by last_date ascending."""
    jobs = await db_list_jobs(
        category=category,
        qualification=qualification,
        status=status,
        page=page,
        limit=limit,
    )
    return {"jobs": jobs, "page": page, "limit": limit, "count": len(jobs)}


@app.get("/api/jobs/recommend")
async def recommend_jobs(
    qualification: str           = Query(..., description="10th|12th|graduate|postgraduate|any"),
    age:           int           = Query(..., ge=14, le=60),
    category:      Optional[str] = Query(None),
):
    """
    KEY DIFFERENTIATOR — personalised job recommendations by qualification + age.
    SarkariResult has nothing like this.
    """
    categories = [category] if category else None
    jobs = await db_get_recommended_jobs(
        qualification=qualification, age=age, categories=categories
    )
    return {"jobs": jobs, "count": len(jobs)}


@app.get("/api/jobs/{slug}")
async def get_job(slug: str):
    """Get single job by slug for job detail page + JobPosting schema."""
    job = await db_get_job_by_slug(slug)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# ---------------------------------------------------------------------------
# Routes — Telegram Subscription
# ---------------------------------------------------------------------------

@app.post("/api/subscribe/telegram")
async def subscribe_telegram(
    telegram_id:   int,
    name:          Optional[str]       = None,
    categories:    Optional[List[str]] = None,
    qualification: Optional[str]       = None,
):
    """Register a Telegram user and create category/qualification subscriptions."""
    user = await db_get_or_create_user(telegram_id=telegram_id, name=name)
    user_id = user["id"]

    if qualification:
        await db_update_user(telegram_id, qualification=qualification)

    if categories:
        for cat in categories:
            await db_subscribe(user_id=user_id, category=cat, qualification=qualification)
    else:
        # Subscribe to all categories
        await db_subscribe(user_id=user_id, category=None, qualification=qualification)

    return {"ok": True, "user_id": user_id, "message": "Subscribed successfully"}


@app.delete("/api/subscribe/telegram/{telegram_id}")
async def unsubscribe_telegram(telegram_id: int):
    """Deactivate all subscriptions for a Telegram user."""
    from db import _pool
    async with _pool.acquire() as conn:
        await conn.execute("""
            UPDATE subscriptions SET active = FALSE
            WHERE user_id = (SELECT id FROM users WHERE telegram_id = $1)
        """, telegram_id)
    return {"ok": True, "message": "Unsubscribed"}


# ---------------------------------------------------------------------------
# Routes — Admin / Utility
# ---------------------------------------------------------------------------

@app.post("/api/scrape/trigger")
async def trigger_scrape():
    """Manually trigger a full scrape (admin use)."""
    import asyncio
    from scraper import scrape_all_sources
    asyncio.create_task(scrape_all_sources())
    return {"ok": True, "message": "Scrape started in background"}


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "haryana-naukri-api"}
