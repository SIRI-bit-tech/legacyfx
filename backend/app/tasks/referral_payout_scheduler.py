"""
Scheduler for daily referral payouts.
Runs at midnight (configurable via REFERRAL_PAYOUT_HOUR in config).
"""
import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.services.referral_service import ReferralService
from app.utils.ably import get_ably_client
from app.config import get_settings
from datetime import datetime
from pytz import UTC

logger = logging.getLogger(__name__)
settings = get_settings()

scheduler = AsyncIOScheduler()


async def run_daily_payout():
    """Execute daily referral payouts."""
    logger.info("Starting daily referral payout job...")
    
    try:
        async with async_session() as db:
            ably_client = get_ably_client()
            
            result = await ReferralService.run_daily_payout(
                db=db,
                ably_client=ably_client
            )
            
            logger.info(
                f"Daily payout completed: {result['payouts_processed']} payouts, "
                f"${result['total_amount']:.2f} total"
            )
    except Exception as e:
        logger.error(f"Daily payout job failed: {e}", exc_info=True)


def start_scheduler():
    """Start the APScheduler for referral payouts."""
    payout_hour = settings.REFERRAL_PAYOUT_HOUR
    
    # Schedule daily payout at configured hour (default midnight) in UTC
    scheduler.add_job(
        run_daily_payout,
        trigger=CronTrigger(hour=payout_hour, minute=0, timezone=UTC),
        id="daily_referral_payout",
        name="Daily Referral Payout",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600 # 1 hour grace time
    )
    
    scheduler.start()
    logger.info(f"Referral payout scheduler started (runs daily at {payout_hour}:00)")


def stop_scheduler():
    """Stop the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Referral payout scheduler stopped")
