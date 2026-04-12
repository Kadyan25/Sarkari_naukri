"""
scheduler.py — APScheduler background jobs.
Adapted from audit scheduler: keeps AsyncIOScheduler pattern exactly.
Jobs: scrape_all_sources() every 30 min + send_pending_alerts() every 5 min.
"""
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)
_scheduler = AsyncIOScheduler()


async def _run_scraper():
    """Scrape all sources and upsert jobs to DB."""
    from scraper import scrape_all_sources  # local import avoids circular
    try:
        total = await scrape_all_sources()
        logger.info("Scheduled scrape complete — %d jobs upserted", total)
    except Exception as exc:
        logger.error("Scheduled scrape failed: %s", exc, exc_info=True)


async def _run_alerts():
    """Send pending Telegram alerts in batches."""
    from telegram_bot import send_pending_alerts  # local import avoids circular
    try:
        sent = await send_pending_alerts()
        if sent:
            logger.info("Sent %d Telegram alerts", sent)
    except Exception as exc:
        logger.error("Alert send failed: %s", exc, exc_info=True)


def start_scheduler():
    _scheduler.add_job(_run_scraper, "interval", minutes=30, id="scraper",
                       max_instances=1, coalesce=True)
    _scheduler.add_job(_run_alerts,  "interval", minutes=5,  id="alerts",
                       max_instances=1, coalesce=True)
    _scheduler.start()
    logger.info("APScheduler started — scraper every 30 min, alerts every 5 min")


def stop_scheduler():
    _scheduler.shutdown(wait=False)
    logger.info("APScheduler stopped")
