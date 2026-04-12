"""
telegram_bot.py — Haryana Sarkari Naukri Telegram Bot.
Commands: /start /subscribe /jobs /stop /recommend
Alert sender: send_pending_alerts() called by scheduler every 5 min.
Uses python-telegram-bot==21.0 async API.
"""
import logging
from typing import Optional

from telegram import (
    Bot, InlineKeyboardButton, InlineKeyboardMarkup, Update,
)
from telegram.constants import ParseMode
from telegram.error import Forbidden, TelegramError
from telegram.ext import (
    Application, CallbackQueryHandler, CommandHandler,
    ContextTypes, ConversationHandler, MessageHandler, filters,
)

from config import TELEGRAM_BOT_TOKEN

logger = logging.getLogger(__name__)

# ── Conversation states ────────────────────────────────────────────────────
ASK_QUALIFICATION, ASK_AGE, ASK_CATEGORY = range(3)

SITE_URL = "https://yourdomain.in"

# Shared Application instance — initialised in init_bot()
_app: Optional[Application] = None


def get_bot() -> Bot:
    if _app is None:
        raise RuntimeError("Bot not initialised — call init_bot() first")
    return _app.bot


# ---------------------------------------------------------------------------
# /start
# ---------------------------------------------------------------------------

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🔔 *Haryana Sarkari Naukri Alert Bot*\n\n"
        "हरियाणा की सभी सरकारी नौकरियों का अलर्ट पाएं — बिल्कुल मुफ्त।\n\n"
        "*Commands:*\n"
        "/subscribe — अलर्ट चालू करें\n"
        "/jobs — ताजा नौकरियां देखें\n"
        "/recommend — अपनी योग्यता के अनुसार नौकरियां\n"
        "/stop — अलर्ट बंद करें",
        parse_mode=ParseMode.MARKDOWN,
    )


# ---------------------------------------------------------------------------
# /jobs — show 5 latest active jobs
# ---------------------------------------------------------------------------

async def cmd_jobs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from db import db_list_jobs
    try:
        jobs = await db_list_jobs(status="active", page=1, limit=5)
    except Exception as exc:
        logger.error("cmd_jobs db error: %s", exc)
        await update.message.reply_text("⚠️ डेटा लोड नहीं हो सका। बाद में कोशिश करें।")
        return

    if not jobs:
        await update.message.reply_text("अभी कोई भर्ती उपलब्ध नहीं है।")
        return

    lines = ["📋 *ताजा सरकारी नौकरियां:*\n"]
    for job in jobs:
        date_str = str(job.get("last_date") or "N/A")
        lines.append(
            f"▪️ *{job['title']}*\n"
            f"   📅 अंतिम तिथि: {date_str}\n"
            f"   🔗 {SITE_URL}/job/{job['slug']}\n"
        )

    await update.message.reply_text(
        "\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        disable_web_page_preview=True,
    )


# ---------------------------------------------------------------------------
# /recommend — personalised jobs by qualification + age from user profile
# ---------------------------------------------------------------------------

async def cmd_recommend(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from db import db_get_user_by_telegram, db_get_recommended_jobs
    tid = update.effective_user.id

    user = await db_get_user_by_telegram(tid)
    if not user or not user.get("qualification") or not user.get("age"):
        await update.message.reply_text(
            "पहले /subscribe करें और अपनी योग्यता + उम्र दर्ज करें।"
        )
        return

    jobs = await db_get_recommended_jobs(
        qualification=user["qualification"], age=user["age"]
    )
    if not jobs:
        await update.message.reply_text("आपकी योग्यता के अनुसार अभी कोई भर्ती नहीं है।")
        return

    lines = [f"🎯 *आपके लिए भर्तियां ({user['qualification']}, {user['age']} वर्ष):*\n"]
    for job in jobs[:5]:
        date_str = str(job.get("last_date") or "N/A")
        lines.append(
            f"▪️ *{job['title']}*\n"
            f"   📅 अंतिम तिथि: {date_str}\n"
            f"   🔗 {SITE_URL}/job/{job['slug']}\n"
        )

    await update.message.reply_text(
        "\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        disable_web_page_preview=True,
    )


# ---------------------------------------------------------------------------
# /subscribe — ConversationHandler (qualification → age → category)
# ---------------------------------------------------------------------------

async def cmd_subscribe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("10वीं पास",   callback_data="qual_10th"),
         InlineKeyboardButton("12वीं पास",   callback_data="qual_12th")],
        [InlineKeyboardButton("Graduate",    callback_data="qual_graduate"),
         InlineKeyboardButton("Post Grad",   callback_data="qual_postgraduate")],
        [InlineKeyboardButton("कोई भी",      callback_data="qual_any")],
    ]
    await update.message.reply_text(
        "📝 *अपनी शैक्षिक योग्यता चुनें:*",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return ASK_QUALIFICATION


async def received_qualification(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    qual = query.data.replace("qual_", "")
    context.user_data["qualification"] = qual

    await query.edit_message_text(
        f"✅ योग्यता: *{qual}*\n\n📅 अब अपनी *उम्र* टाइप करें (जैसे: 24):",
        parse_mode=ParseMode.MARKDOWN,
    )
    return ASK_AGE


async def received_age(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    if not text.isdigit() or not (14 <= int(text) <= 60):
        await update.message.reply_text("कृपया सही उम्र दर्ज करें (14–60 के बीच):")
        return ASK_AGE

    context.user_data["age"] = int(text)

    keyboard = [
        [InlineKeyboardButton("HSSC",    callback_data="cat_hssc"),
         InlineKeyboardButton("HPSC",    callback_data="cat_hpsc")],
        [InlineKeyboardButton("पुलिस",   callback_data="cat_police"),
         InlineKeyboardButton("Banking", callback_data="cat_banking")],
        [InlineKeyboardButton("Railway", callback_data="cat_railway"),
         InlineKeyboardButton("SSC",     callback_data="cat_ssc")],
        [InlineKeyboardButton("🔔 सभी भर्तियां", callback_data="cat_all")],
    ]
    await update.message.reply_text(
        "📂 *किस विभाग की भर्ती का अलर्ट चाहिए?*",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return ASK_CATEGORY


async def received_category(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from db import db_get_or_create_user, db_subscribe, db_update_user

    query = update.callback_query
    await query.answer()

    cat_raw = query.data.replace("cat_", "")
    category = None if cat_raw == "all" else cat_raw

    tid  = update.effective_user.id
    name = update.effective_user.full_name
    qual = context.user_data.get("qualification", "any")
    age  = context.user_data.get("age", 25)

    try:
        user = await db_get_or_create_user(telegram_id=tid, name=name)
        await db_update_user(tid, qualification=qual, age=age)
        await db_subscribe(user_id=user["id"], category=category, qualification=qual)
    except Exception as exc:
        logger.error("Subscribe DB error tid=%s: %s", tid, exc)
        await query.edit_message_text("⚠️ कुछ गड़बड़ हो गई। /subscribe से दोबारा कोशिश करें।")
        return ConversationHandler.END

    cat_label = cat_raw.upper() if cat_raw != "all" else "सभी विभाग"
    await query.edit_message_text(
        f"✅ *अलर्ट चालू हो गया!*\n\n"
        f"🎓 योग्यता: {qual}\n"
        f"📅 उम्र: {age} वर्ष\n"
        f"📂 विभाग: {cat_label}\n\n"
        f"जैसे ही नई भर्ती आएगी, आपको तुरंत सूचित किया जाएगा। 🔔\n\n"
        f"_अलर्ट बंद करने के लिए /stop टाइप करें।_",
        parse_mode=ParseMode.MARKDOWN,
    )
    return ConversationHandler.END


async def cancel_subscribe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ रद्द किया गया।")
    return ConversationHandler.END


# ---------------------------------------------------------------------------
# /stop — unsubscribe
# ---------------------------------------------------------------------------

async def cmd_stop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from db import _pool
    tid = update.effective_user.id
    try:
        async with _pool.acquire() as conn:
            await conn.execute("""
                UPDATE subscriptions SET active = FALSE
                WHERE user_id = (SELECT id FROM users WHERE telegram_id = $1)
            """, tid)
        await update.message.reply_text(
            "🔕 अलर्ट बंद कर दिया गया।\n"
            "दोबारा चालू करने के लिए /subscribe टाइप करें।"
        )
    except Exception as exc:
        logger.error("cmd_stop error tid=%s: %s", tid, exc)
        await update.message.reply_text("⚠️ कुछ गड़बड़ हो गई। बाद में कोशिश करें।")


# ---------------------------------------------------------------------------
# Alert sender — called by scheduler every 5 min
# ---------------------------------------------------------------------------

async def send_job_alert(bot: Bot, telegram_id: int, job: dict):
    """Send a single job alert in Hindi."""
    date_str = str(job.get("last_date") or "N/A")
    msg = (
        f"🔔 *नई भर्ती: {job['title']}*\n\n"
        f"📋 पद: {job.get('total_posts') or 'N/A'}\n"
        f"📅 अंतिम तिथि: {date_str}\n"
        f"🎓 योग्यता: {job.get('qualification') or 'N/A'}\n"
        f"💰 वेतन: {job.get('salary') or 'N/A'}\n\n"
        f"👉 पूरी जानकारी: {SITE_URL}/job/{job['slug']}"
    )
    await bot.send_message(
        chat_id=telegram_id,
        text=msg,
        parse_mode=ParseMode.MARKDOWN,
        disable_web_page_preview=True,
    )


async def send_pending_alerts() -> int:
    """
    Fetch unsent alerts from DB and send via Telegram.
    Called by scheduler every 5 min. Returns count sent.
    """
    from db import db_get_pending_alerts, db_mark_alert_sent

    if _app is None:
        logger.warning("send_pending_alerts: bot not initialised, skipping")
        return 0

    bot = _app.bot
    alerts = await db_get_pending_alerts(limit=100)
    sent = 0

    for alert in alerts:
        tid = alert.get("telegram_id")
        if not tid:
            continue
        try:
            await send_job_alert(bot, tid, alert)
            await db_mark_alert_sent(alert["id"])
            sent += 1
        except Forbidden:
            # User blocked the bot — mark as sent so we don't retry forever
            logger.info("User blocked bot telegram_id=%s, marking alert sent", tid)
            await db_mark_alert_sent(alert["id"])
        except TelegramError as exc:
            logger.error("Alert send failed alert_id=%s tid=%s: %s", alert["id"], tid, exc)

    if sent:
        logger.info("send_pending_alerts: sent %d alerts", sent)
    return sent


# ---------------------------------------------------------------------------
# Bot lifecycle — called from main.py lifespan
# ---------------------------------------------------------------------------

async def init_bot():
    """Build and start the bot (polling). Called at app startup."""
    global _app

    if not TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not set — Telegram bot disabled")
        return

    subscribe_conv = ConversationHandler(
        entry_points=[CommandHandler("subscribe", cmd_subscribe)],
        states={
            ASK_QUALIFICATION: [CallbackQueryHandler(received_qualification, pattern="^qual_")],
            ASK_AGE:           [MessageHandler(filters.TEXT & ~filters.COMMAND, received_age)],
            ASK_CATEGORY:      [CallbackQueryHandler(received_category, pattern="^cat_")],
        },
        fallbacks=[CommandHandler("cancel", cancel_subscribe)],
        per_user=True,
    )

    _app = (
        Application.builder()
        .token(TELEGRAM_BOT_TOKEN)
        .build()
    )

    _app.add_handler(CommandHandler("start",     cmd_start))
    _app.add_handler(CommandHandler("jobs",      cmd_jobs))
    _app.add_handler(CommandHandler("recommend", cmd_recommend))
    _app.add_handler(CommandHandler("stop",      cmd_stop))
    _app.add_handler(subscribe_conv)

    await _app.initialize()
    await _app.start()
    await _app.updater.start_polling(drop_pending_updates=True)
    logger.info("Telegram bot started (polling)")


async def stop_bot():
    """Gracefully stop the bot. Called at app shutdown."""
    global _app
    if _app is None:
        return
    await _app.updater.stop()
    await _app.stop()
    await _app.shutdown()
    _app = None
    logger.info("Telegram bot stopped")
