import asyncpg
from typing import Any, Dict, List, Optional

from config import DB_URL

_pool: asyncpg.Pool = None


async def init_db():
    global _pool
    _pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=10)
    async with _pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id               SERIAL PRIMARY KEY,
                slug             TEXT UNIQUE NOT NULL,
                title            TEXT NOT NULL,
                title_hindi      TEXT,
                category         TEXT NOT NULL,
                state            TEXT DEFAULT 'haryana',
                post_type        TEXT,
                qualification    TEXT,
                total_posts      INTEGER,
                last_date        DATE,
                apply_start      DATE,
                age_min          INTEGER,
                age_max          INTEGER,
                salary           TEXT,
                application_fee  TEXT,
                official_url     TEXT,
                notification_pdf TEXT,
                source           TEXT,
                status           TEXT DEFAULT 'active',
                created_at       TIMESTAMPTZ DEFAULT NOW(),
                updated_at       TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_category      ON jobs(category)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_last_date     ON jobs(last_date)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status        ON jobs(status)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_qualification ON jobs(qualification)")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id          SERIAL PRIMARY KEY,
                telegram_id BIGINT UNIQUE,
                email       TEXT UNIQUE,
                name        TEXT,
                qualification TEXT,
                age         INTEGER,
                location    TEXT DEFAULT 'haryana',
                created_at  TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id            SERIAL PRIMARY KEY,
                user_id       INTEGER REFERENCES users(id),
                category      TEXT,
                qualification TEXT,
                active        BOOLEAN DEFAULT TRUE
            )
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id         SERIAL PRIMARY KEY,
                user_id    INTEGER REFERENCES users(id),
                job_id     INTEGER REFERENCES jobs(id),
                channel    TEXT DEFAULT 'telegram',
                sent       BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS scraper_runs (
                id         SERIAL PRIMARY KEY,
                source     TEXT NOT NULL,
                job_count  INTEGER NOT NULL DEFAULT 0,
                status     TEXT NOT NULL DEFAULT 'ok',
                ran_at     TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_scraper_runs_source ON scraper_runs(source)"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_scraper_runs_ran_at ON scraper_runs(ran_at)"
        )


async def close_db():
    global _pool
    if _pool:
        await _pool.close()


# ── Scraper monitor ──────────────────────────────────────────────────────────

async def db_log_scraper_run(source: str, job_count: int, status: str = "ok") -> None:
    async with _pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO scraper_runs (source, job_count, status) VALUES ($1, $2, $3)",
            source, job_count, status,
        )


async def db_get_scraper_health(last_n: int = 3) -> List[Dict[str, Any]]:
    """
    Return per-source health: last N runs, consecutive zero count, and status.
    A source is 'blocked' if it returned 0 jobs in every one of its last N runs.
    """
    async with _pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT DISTINCT source FROM scraper_runs
        """)
        sources = [r["source"] for r in rows]

        health = []
        for source in sources:
            runs = await conn.fetch("""
                SELECT job_count, status, ran_at
                FROM scraper_runs
                WHERE source = $1
                ORDER BY ran_at DESC
                LIMIT $2
            """, source, last_n)

            counts = [r["job_count"] for r in runs]
            consecutive_zeros = sum(1 for c in counts if c == 0)
            last_count = counts[0] if counts else None
            last_ran = runs[0]["ran_at"] if runs else None

            health.append({
                "source":            source,
                "last_job_count":    last_count,
                "consecutive_zeros": consecutive_zeros,
                "last_ran":          last_ran.isoformat() if last_ran else None,
                "status": (
                    "blocked" if consecutive_zeros == last_n and last_n > 0
                    else "warn" if consecutive_zeros >= 1
                    else "ok"
                ),
                "recent_counts": counts,
            })

        return sorted(health, key=lambda x: x["source"])


# ── Jobs ─────────────────────────────────────────────────────────────────────

async def db_upsert_job(job: Dict[str, Any]) -> int:
    """Insert or update a job by slug. Returns the job id."""
    async with _pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO jobs (
                slug, title, title_hindi, category, state, post_type, qualification,
                total_posts, last_date, apply_start, age_min, age_max, salary,
                application_fee, official_url, notification_pdf, source, status
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
            ON CONFLICT (slug) DO UPDATE SET
                title         = EXCLUDED.title,
                category      = EXCLUDED.category,
                qualification = EXCLUDED.qualification,
                last_date     = EXCLUDED.last_date,
                status        = EXCLUDED.status,
                updated_at    = NOW()
            RETURNING id
        """,
            job.get("slug"),            job.get("title"),
            job.get("title_hindi"),     job.get("category"),
            job.get("state", "haryana"),job.get("post_type"),
            job.get("qualification"),   job.get("total_posts"),
            job.get("last_date"),       job.get("apply_start"),
            job.get("age_min"),         job.get("age_max"),
            job.get("salary"),          job.get("application_fee"),
            job.get("official_url"),    job.get("notification_pdf"),
            job.get("source"),          job.get("status", "active"),
        )
        return row["id"]


async def db_get_job_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    async with _pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM jobs WHERE slug = $1", slug)
        return dict(row) if row else None


async def db_list_jobs(
    category: str = None,
    qualification: str = None,
    status: str = "active",
    page: int = 1,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    offset = (page - 1) * limit
    filters = ["j.status = $1", "j.last_date >= CURRENT_DATE"]
    params: list = [status]
    i = 2
    if category:
        filters.append(f"j.category = ${i}")
        params.append(category)
        i += 1
    if qualification:
        filters.append(f"(j.qualification = ${i} OR j.qualification = 'any')")
        params.append(qualification)
        i += 1
    where = " AND ".join(filters)
    params += [limit, offset]
    async with _pool.acquire() as conn:
        rows = await conn.fetch(
            f"SELECT * FROM jobs j WHERE {where} ORDER BY last_date ASC LIMIT ${i} OFFSET ${i+1}",
            *params,
        )
        return [dict(r) for r in rows]


async def db_get_recommended_jobs(
    qualification: str, age: int, categories: List[str] = None
) -> List[Dict[str, Any]]:
    async with _pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM jobs
            WHERE status = 'active'
            AND last_date >= CURRENT_DATE
            AND (qualification = $1 OR qualification = 'any')
            AND ($2 BETWEEN COALESCE(age_min, 0) AND COALESCE(age_max, 99))
            AND ($3::text[] IS NULL OR category = ANY($3))
            ORDER BY last_date ASC
            LIMIT 20
        """, qualification, age, categories)
        return [dict(r) for r in rows]


async def db_get_all_jobs(limit: int = 100) -> List[Dict[str, Any]]:
    async with _pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1", limit
        )
        return [dict(r) for r in rows]


# ── Users ─────────────────────────────────────────────────────────────────────

async def db_get_or_create_user(telegram_id: int, name: str = None) -> Dict[str, Any]:
    async with _pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO users (telegram_id, name)
            VALUES ($1, $2)
            ON CONFLICT (telegram_id) DO UPDATE
                SET name = COALESCE(EXCLUDED.name, users.name)
            RETURNING *
        """, telegram_id, name)
        return dict(row)


async def db_update_user(telegram_id: int, **kwargs) -> None:
    if not kwargs:
        return
    sets = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(kwargs))
    async with _pool.acquire() as conn:
        await conn.execute(
            f"UPDATE users SET {sets} WHERE telegram_id = $1",
            telegram_id, *kwargs.values(),
        )


async def db_get_user_by_telegram(telegram_id: int) -> Optional[Dict[str, Any]]:
    async with _pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM users WHERE telegram_id = $1", telegram_id
        )
        return dict(row) if row else None


# ── Subscriptions ─────────────────────────────────────────────────────────────

async def db_subscribe(user_id: int, category: str = None, qualification: str = None) -> None:
    async with _pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO subscriptions (user_id, category, qualification)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
        """, user_id, category, qualification)


async def db_get_active_subscriptions() -> List[Dict[str, Any]]:
    async with _pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT s.*, u.telegram_id, u.qualification AS user_qualification, u.age
            FROM subscriptions s
            JOIN users u ON u.id = s.user_id
            WHERE s.active = TRUE AND u.telegram_id IS NOT NULL
        """)
        return [dict(r) for r in rows]


# ── Alerts ────────────────────────────────────────────────────────────────────

async def db_queue_alerts(job_id: int) -> None:
    """Queue unsent alerts for all active subscribers matching this job's category/qualification."""
    async with _pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO alerts (user_id, job_id)
            SELECT s.user_id, $1
            FROM subscriptions s
            JOIN jobs j ON j.id = $1
            WHERE s.active = TRUE
            AND (s.category IS NULL OR s.category = j.category)
            AND (s.qualification IS NULL
                 OR s.qualification = j.qualification
                 OR j.qualification = 'any')
            ON CONFLICT DO NOTHING
        """, job_id)


async def db_get_pending_alerts(limit: int = 100) -> List[Dict[str, Any]]:
    async with _pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT a.id, a.user_id, a.job_id,
                   u.telegram_id,
                   j.title, j.title_hindi, j.slug, j.category,
                   j.total_posts, j.last_date, j.qualification, j.salary
            FROM alerts a
            JOIN users u ON u.id = a.user_id
            JOIN jobs  j ON j.id = a.job_id
            WHERE a.sent = FALSE
            ORDER BY a.created_at ASC
            LIMIT $1
        """, limit)
        return [dict(r) for r in rows]


async def db_mark_alert_sent(alert_id: int) -> None:
    async with _pool.acquire() as conn:
        await conn.execute("UPDATE alerts SET sent = TRUE WHERE id = $1", alert_id)
