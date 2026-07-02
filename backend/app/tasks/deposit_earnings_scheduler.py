import asyncio
import logging
import uuid
from datetime import datetime
from collections import defaultdict
from pytz import UTC
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.user import User
from app.models.finance import Deposit, DepositStatus, Transaction, TransactionType
from app.models.notification import Notification
from app.utils.email import send_email, create_email_template
from app.utils.ably import get_ably_client
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

scheduler = AsyncIOScheduler()


async def process_daily_deposit_earnings():
    """Calculate and pay out daily earnings on approved deposits.
    
    If deposit >= $50: user earns $5 daily.
    If deposit < $50: user earns $3 daily.
    """
    logger.info("Starting daily deposit earnings payout job...")
    
    try:
        async with async_session() as db:
            # Payouts are run for the current calendar day.
            # Only select deposits that are CONFIRMED and haven't been paid today.
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            stmt = select(Deposit, User).join(
                User, Deposit.user_id == User.id
            ).where(
                Deposit.status == DepositStatus.CONFIRMED,
                (Deposit.last_earning_payout_at.is_(None) | (Deposit.last_earning_payout_at < today))
            )
            
            result = await db.execute(stmt)
            rows = result.all()
            
            if not rows:
                logger.info("No deposits eligible for daily earnings payout today.")
                return {"payouts_processed": 0, "total_amount": 0.0}
            
            # Group by user to aggregate notifications and updates
            user_deposits = defaultdict(list)
            for deposit, user in rows:
                user_deposits[user].append(deposit)
                
            ably_client = None
            try:
                ably_client = get_ably_client()
            except Exception as e:
                logger.warning(f"Ably client not available: {e}")
                
            payouts_count = 0
            total_paid_amount = 0.0
            
            for user, deposits in user_deposits.items():
                user_payout_total = 0.0
                deposit_details = []
                
                for deposit in deposits:
                    # Check deposit amount. Use fiat_amount (which represents USD value at approval)
                    # and fallback to amount if fiat_amount is not set.
                    usd_val = deposit.fiat_amount if deposit.fiat_amount is not None else deposit.amount
                    
                    payout_amount = 5.0 if usd_val >= 50.0 else 3.0
                    user_payout_total += payout_amount
                    
                    # Update deposit payout timestamp
                    deposit.last_earning_payout_at = datetime.utcnow()
                    
                    # Log individual transaction for auditing
                    tx = Transaction(
                        id=str(uuid.uuid4()),
                        user_id=user.id,
                        type=TransactionType.INVESTMENT_RETURN,
                        asset_symbol="USD",
                        amount=payout_amount,
                        usd_amount=payout_amount,
                        description=f"Daily deposit return for {deposit.amount} {deposit.asset_symbol}",
                        reference_id=deposit.id,
                        status="COMPLETED",
                        created_at=datetime.utcnow()
                    )
                    db.add(tx)
                    
                    deposit_details.append(
                        f"• {deposit.amount} {deposit.asset_symbol} (valued at ${usd_val:.2f}): earned ${payout_amount:.2f}"
                    )
                    payouts_count += 1
                
                # Credit the user's balances
                user.account_balance += user_payout_total
                user.trading_balance += user_payout_total
                total_paid_amount += user_payout_total
                
                # Create in-app Notification
                notification = Notification(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    type="DEPOSIT",
                    title="Daily Deposit Earnings Credited",
                    message=f"Good morning! Your account has been credited with ${user_payout_total:.2f} daily earnings from your approved deposits.",
                    is_read=False,
                    created_at=datetime.utcnow()
                )
                db.add(notification)
                
                # Broadcast real-time notification
                if ably_client:
                    try:
                        channel = ably_client.channels.get(f"notifications:{user.id}")
                        await channel.publish("new_notification", {
                            "id": notification.id,
                            "type": notification.type,
                            "title": notification.title,
                            "message": notification.message,
                            "is_read": notification.is_read,
                            "link": None,
                            "created_at": notification.created_at.isoformat()
                        })
                    except Exception as e:
                        logger.error(f"Failed to publish Ably notification for user {user.id}: {e}")
                
                # Send email notification
                email_message = (
                    f"Good morning!<br/><br/>"
                    f"We are pleased to inform you that your daily deposit earnings have been credited to your account.<br/><br/>"
                    f"<b>Total Credited Today:</b> ${user_payout_total:.2f}<br/>"
                    f"<b>New Account Balance:</b> ${user.account_balance:.2f}<br/><br/>"
                    f"<b>Earnings Breakdown:</b><br/>" + "<br/>".join(deposit_details) + "<br/><br/>"
                    f"The funds have been added to your trading balance and are available for immediate use.<br/><br/>"
                    f"Thank you for choosing Prime Meridian Markets!"
                )
                email_content = create_email_template(
                    title="Daily Deposit Earnings Credited",
                    message=email_message,
                    code=None,
                    escape_html=False
                )
                
                # Send email in background task
                asyncio.create_task(send_email(
                    user.email,
                    "Daily Deposit Earnings Credited - Prime Meridian Markets",
                    email_content
                ))
            
            await db.commit()
            logger.info(
                f"Successfully completed daily deposit earnings payout: "
                f"{payouts_count} payouts processed across {len(user_deposits)} users. "
                f"Total amount paid: ${total_paid_amount:.2f}"
            )
            return {"payouts_processed": payouts_count, "total_amount": total_paid_amount}
            
    except Exception as e:
        logger.error(f"Daily deposit earnings payout job failed: {e}", exc_info=True)
        return {"error": str(e)}


def start_scheduler():
    """Start the APScheduler for daily deposit earnings."""
    # Run daily in the morning. Default is 06:00 UTC (roughly morning hours).
    payout_hour = getattr(settings, "DEPOSIT_EARNINGS_HOUR", 6)
    
    scheduler.add_job(
        process_daily_deposit_earnings,
        trigger=CronTrigger(hour=payout_hour, minute=0, timezone=UTC),
        id="daily_deposit_earnings",
        name="Daily Deposit Earnings Payout",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600 # 1 hour grace time
    )
    
    scheduler.start()
    logger.info(f"Deposit earnings scheduler started (runs daily at {payout_hour:02d}:00 UTC)")


def stop_scheduler():
    """Stop the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Deposit earnings scheduler stopped")
