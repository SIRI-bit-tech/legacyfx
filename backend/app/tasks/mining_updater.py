import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import async_session
from app.services.mining_data import mining_data_service
from app.models.mining import MiningSubscription, MiningStatus, MiningPlan
from app.models.user import User
from app.models.finance import Transaction, TransactionType

logger = logging.getLogger(__name__)

# Initialize Scheduler
scheduler = AsyncIOScheduler()

async def update_mining_stats_job():
    """Job to update real-time mining stats every 10 minutes."""
    try:
        async with async_session() as db:
            logger.info("Updating real-time mining stats...")
            await mining_data_service.update_cached_stats(db)
    except Exception as e:
        logger.error(f"Error in update_mining_stats_job: {str(e)}")

async def process_mining_payouts_job():
    """Job to process mining earnings daily."""
    try:
        async with async_session() as db:
            logger.info("Processing daily mining payouts...")
            
            stmt = select(MiningSubscription, MiningPlan, User).join(
                MiningPlan, MiningSubscription.plan_id == MiningPlan.id
            ).join(User, MiningSubscription.user_id == User.id).where(
                MiningSubscription.status == MiningStatus.ACTIVE
            )
            
            result = await db.execute(stmt)
            rows = result.all()
            
            for sub, plan, user in rows:
                # Calculate daily earning
                earning = plan.daily_earnings
                
                # Update User Balance
                user.trading_balance += earning
                
                # Update Sub total earnings
                sub.total_earnings = (sub.total_earnings or 0.0) + earning
                
                # Log Transaction
                import uuid
                tx = Transaction(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    type=TransactionType.MINING_REWARD,
                    asset_symbol=plan.coin_symbol,
                    amount=earning,
                    description=f"Mining reward from {plan.name}",
                    status="COMPLETED",
                    created_at=datetime.utcnow()
                )
                db.add(tx)
            
            await db.commit()
            logger.info(f"Processed payouts for {len(rows)} active miners.")
            
    except Exception as e:
        logger.error(f"Error in process_mining_payouts_job: {str(e)}")
        await db.rollback()

def start_mining_background_tasks():
    """Add mining jobs to the scheduler and start it."""
    # Add Job: Update Stats Every 10 Minutes
    scheduler.add_job(
        update_mining_stats_job,
        trigger=IntervalTrigger(minutes=10),
        id='update_mining_stats',
        replace_existing=True
    )
    
    # Add Job: Process Payouts Every 24 Hours
    scheduler.add_job(
        process_mining_payouts_job,
        trigger=IntervalTrigger(hours=24),
        id='process_mining_payouts',
        replace_existing=True
    )
    
    if not scheduler.running:
        scheduler.start()
        logger.info("Mining background task scheduler started.")
