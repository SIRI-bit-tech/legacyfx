# Referral service for managing referrals, commissions, and payouts
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from datetime import datetime, timedelta, date
from typing import Optional, List, Tuple
from decimal import Decimal
import logging
import random
import uuid

from app.models.referral import (
    Referral, ReferralCommission, ReferralPayout,
    ReferralStatus, CommissionStatus, CommissionSourceType, PayoutStatus
)
from app.models.user import User
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class ReferralService:
    """Service layer for referral operations"""
    
    @staticmethod
    async def generate_referral_code(username: str, db: AsyncSession) -> str:
        """Generate unique referral code for user"""
        max_attempts = 10
        for _ in range(max_attempts):
            clean_username = username.upper().replace('_', '')
            random_suffix = ''.join([str(random.randint(0, 9)) for _ in range(4)])
            code = f"LEGACY{clean_username}{random_suffix}"
            
            # Check uniqueness
            stmt = select(User).where(User.referral_code == code)
            result = await db.execute(stmt)
            if not result.scalar_one_or_none():
                return code
        
        # Fallback to UUID if all attempts fail
        return f"LEGACY_{uuid.uuid4().hex[:8].upper()}"
    
    @staticmethod
    async def process_referral_signup(
        referred_user_id: str,
        referral_code: str,
        db: AsyncSession,
        ably_client=None
    ) -> Optional[str]:
        """Process referral signup - create Referral record"""
        # Find referrer by code
        stmt = select(User).where(User.referral_code == referral_code)
        result = await db.execute(stmt)
        referrer = result.scalar_one_or_none()
        
        if not referrer:
            logger.warning(f"Invalid referral code: {referral_code}")
            return None
        
        # Create Referral record
        referral = Referral(
            id=str(uuid.uuid4()),
            referrer_id=referrer.id,
            referred_id=referred_user_id,
            referral_code=referral_code,
            status=ReferralStatus.PENDING,
            joined_at=datetime.utcnow()
        )
        
        db.add(referral)
        await db.flush()
        
        # Publish to Ably
        if ably_client:
            try:
                channel = ably_client.channels.get(f"referrals:{referrer.id}")
                await channel.publish("new_signup", {
                    "type": "new_signup",
                    "referral_id": referral.id,
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"Failed to publish new_signup event: {e}")
        
        logger.info(f"Referral signup processed: {referred_user_id} via {referral_code}")
        return referral.id
    
    @staticmethod
    async def activate_referral(
        referred_user_id: str,
        db: AsyncSession,
        ably_client=None
    ):
        """Activate referral when referred user makes first deposit"""
        # Find referral
        stmt = select(Referral).where(
            Referral.referred_id == referred_user_id,
            Referral.status == ReferralStatus.PENDING
        )
        result = await db.execute(stmt)
        referral = result.scalar_one_or_none()
        
        if not referral:
            return
        
        # Update status
        referral.status = ReferralStatus.ACTIVE
        referral.activated_at = datetime.utcnow()
        
        # Recalculate tier for referrer
        await ReferralService.recalculate_tier(referral.referrer_id, db, ably_client)
        
        # Publish to Ably
        if ably_client:
            try:
                channel = ably_client.channels.get(f"referrals:{referral.referrer_id}")
                await channel.publish("activation", {
                    "type": "activation",
                    "referral_id": referral.id,
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"Failed to publish activation event: {e}")
        
        logger.info(f"Referral activated: {referral.id}")
    
    @staticmethod
    async def recalculate_tier(
        user_id: str,
        db: AsyncSession,
        ably_client=None
    ):
        """Recalculate user's referral tier based on active referrals"""
        # Count active referrals
        stmt = select(func.count(Referral.id)).where(
            Referral.referrer_id == user_id,
            Referral.status == ReferralStatus.ACTIVE
        )
        result = await db.execute(stmt)
        active_count = result.scalar() or 0
        
        # Determine tier
        if active_count >= settings.REFERRAL_TIER3_THRESHOLD:
            new_tier = 3
        elif active_count >= settings.REFERRAL_TIER2_THRESHOLD:
            new_tier = 2
        else:
            new_tier = 1
        
        # Update user tier
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if user and user.referral_tier != new_tier:
            old_tier = user.referral_tier
            user.referral_tier = new_tier
            
            # Publish tier upgrade
            if ably_client and new_tier > old_tier:
                try:
                    channel = ably_client.channels.get(f"referrals:{user_id}")
                    await channel.publish("tier_upgraded", {
                        "type": "tier_upgraded",
                        "old_tier": old_tier,
                        "new_tier": new_tier,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                except Exception as e:
                    logger.error(f"Failed to publish tier_upgraded event: {e}")
            
            logger.info(f"User {user_id} tier updated: {old_tier} -> {new_tier}")
    
    @staticmethod
    async def process_trade_commission(
        referred_user_id: str,
        trade_fee: Decimal,
        db: AsyncSession,
        ably_client=None
    ):
        """Process commission for a trade made by referred user"""
        # Find referral
        stmt = select(Referral).where(
            Referral.referred_id == referred_user_id,
            Referral.status == ReferralStatus.ACTIVE
        )
        result = await db.execute(stmt)
        referral = result.scalar_one_or_none()
        
        if not referral:
            return
        
        # Get referrer tier
        user_stmt = select(User).where(User.id == referral.referrer_id)
        user_result = await db.execute(user_stmt)
        referrer = user_result.scalar_one_or_none()
        
        if not referrer:
            return
        
        # Calculate commission based on tier
        tier = referrer.referral_tier or 1
        if tier == 3:
            rate = Decimal(str(settings.REFERRAL_TIER3_RATE))
        elif tier == 2:
            rate = Decimal(str(settings.REFERRAL_TIER2_RATE))
        else:
            rate = Decimal(str(settings.REFERRAL_TIER1_RATE))
        
        commission_amount = trade_fee * rate
        
        # Create commission record
        commission = ReferralCommission(
            id=str(uuid.uuid4()),
            referrer_id=referral.referrer_id,
            referred_id=referred_user_id,
            referral_id=referral.id,
            source_type=CommissionSourceType.TRADE,
            source_amount=trade_fee,
            commission_rate=rate,
            commission_amount=commission_amount,
            tier=tier,
            status=CommissionStatus.PENDING
        )
        
        db.add(commission)
        await db.flush()
        
        # Publish to Ably
        if ably_client:
            try:
                channel = ably_client.channels.get(f"referrals:{referral.referrer_id}")
                await channel.publish("commission_earned", {
                    "type": "commission_earned",
                    "amount": float(commission_amount),
                    "source": "trade",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"Failed to publish commission_earned event: {e}")
        
        logger.info(f"Trade commission created: {commission.id} - ${commission_amount}")
    
    @staticmethod
    async def process_deposit_commission(
        referred_user_id: str,
        deposit_amount: Decimal,
        db: AsyncSession,
        ably_client=None
    ):
        """Process commission for a deposit made by referred user"""
        # Find referral
        stmt = select(Referral).where(
            Referral.referred_id == referred_user_id,
            Referral.status == ReferralStatus.ACTIVE
        )
        result = await db.execute(stmt)
        referral = result.scalar_one_or_none()
        
        if not referral:
            return
        
        # Get referrer tier
        user_stmt = select(User).where(User.id == referral.referrer_id)
        user_result = await db.execute(user_stmt)
        referrer = user_result.scalar_one_or_none()
        
        if not referrer:
            return
        
        # Calculate commission (2% of deposit)
        rate = Decimal(str(settings.REFERRAL_DEPOSIT_COMMISSION_RATE))
        commission_amount = deposit_amount * rate
        tier = referrer.referral_tier or 1
        
        # Create commission record
        commission = ReferralCommission(
            id=str(uuid.uuid4()),
            referrer_id=referral.referrer_id,
            referred_id=referred_user_id,
            referral_id=referral.id,
            source_type=CommissionSourceType.DEPOSIT,
            source_amount=deposit_amount,
            commission_rate=rate,
            commission_amount=commission_amount,
            tier=tier,
            status=CommissionStatus.PENDING
        )
        
        db.add(commission)
        await db.flush()
        
        # Publish to Ably
        if ably_client:
            try:
                channel = ably_client.channels.get(f"referrals:{referral.referrer_id}")
                await channel.publish("commission_earned", {
                    "type": "commission_earned",
                    "amount": float(commission_amount),
                    "source": "deposit",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"Failed to publish commission_earned event: {e}")
        
        logger.info(f"Deposit commission created: {commission.id} - ${commission_amount}")
    
    @staticmethod
    async def run_daily_payout(db: AsyncSession, ably_client=None):
        """Run daily payout - aggregate pending commissions and credit balances"""
        yesterday = date.today() - timedelta(days=1)
        
        # Get all pending commissions from yesterday
        stmt = select(ReferralCommission).where(
            ReferralCommission.status == CommissionStatus.PENDING,
            func.date(ReferralCommission.earned_at) <= yesterday
        )
        result = await db.execute(stmt)
        pending_commissions = result.scalars().all()
        
        # Group by referrer
        referrer_commissions = {}
        for comm in pending_commissions:
            if comm.referrer_id not in referrer_commissions:
                referrer_commissions[comm.referrer_id] = []
            referrer_commissions[comm.referrer_id].append(comm)
        
        # Process each referrer
        for referrer_id, commissions in referrer_commissions.items():
            total_amount = sum(c.commission_amount for c in commissions)
            
            # Create payout record
            payout = ReferralPayout(
                id=str(uuid.uuid4()),
                referrer_id=referrer_id,
                total_amount=total_amount,
                commission_count=len(commissions),
                status=PayoutStatus.COMPLETED,
                payout_date=date.today(),
                paid_at=datetime.utcnow()
            )
            
            db.add(payout)
            
            # Update commission statuses
            for comm in commissions:
                comm.status = CommissionStatus.PAID
                comm.paid_at = datetime.utcnow()
            
            # Credit user balance
            user_stmt = select(User).where(User.id == referrer_id)
            user_result = await db.execute(user_stmt)
            user = user_result.scalar_one_or_none()
            
            if user:
                user.trading_balance += float(total_amount)
                user.referral_earnings += float(total_amount)
            
            # Publish to Ably
            if ably_client:
                try:
                    # Referrals channel
                    ref_channel = ably_client.channels.get(f"referrals:{referrer_id}")
                    await ref_channel.publish("payout_completed", {
                        "type": "payout_completed",
                        "amount": float(total_amount),
                        "commission_count": len(commissions),
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
                    # Funds channel (for assets page update)
                    funds_channel = ably_client.channels.get(f"funds:{referrer_id}")
                    await funds_channel.publish("balance_updated", {
                        "type": "referral_payout",
                        "amount": float(total_amount),
                        "timestamp": datetime.utcnow().isoformat()
                    })
                except Exception as e:
                    logger.error(f"Failed to publish payout events: {e}")
            
            logger.info(f"Payout completed for {referrer_id}: ${total_amount}")
        
        await db.commit()
        logger.info(f"Daily payout completed: {len(referrer_commissions)} referrers processed")
        
        # Return summary
        total_paid = sum(sum(c.commission_amount for c in comms) for comms in referrer_commissions.values())
        return {
            "payouts_processed": len(referrer_commissions),
            "total_amount": float(total_paid)
        }
    
    @staticmethod
    async def get_referral_stats(user_id: str, db: AsyncSession) -> dict:
        """Get comprehensive referral stats for user"""
        # Get user
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise ValueError("User not found")
        
        # Generate referral code if user doesn't have one
        if not user.referral_code:
            username = user.username or user.email.split('@')[0]
            user.referral_code = await ReferralService.generate_referral_code(username, db)
            await db.commit()
        
        # Count referrals by status
        total_stmt = select(func.count(Referral.id)).where(Referral.referrer_id == user_id)
        total_result = await db.execute(total_stmt)
        total_referred = total_result.scalar() or 0
        
        active_stmt = select(func.count(Referral.id)).where(
            Referral.referrer_id == user_id,
            Referral.status == ReferralStatus.ACTIVE
        )
        active_result = await db.execute(active_stmt)
        active_referred = active_result.scalar() or 0
        
        pending_stmt = select(func.count(Referral.id)).where(
            Referral.referrer_id == user_id,
            Referral.status == ReferralStatus.PENDING
        )
        pending_result = await db.execute(pending_stmt)
        pending_referred = pending_result.scalar() or 0
        
        # Commission totals
        pending_comm_stmt = select(func.sum(ReferralCommission.commission_amount)).where(
            ReferralCommission.referrer_id == user_id,
            ReferralCommission.status == CommissionStatus.PENDING
        )
        pending_comm_result = await db.execute(pending_comm_stmt)
        pending_commission = pending_comm_result.scalar() or Decimal('0')
        
        paid_comm_stmt = select(func.sum(ReferralCommission.commission_amount)).where(
            ReferralCommission.referrer_id == user_id,
            ReferralCommission.status == CommissionStatus.PAID
        )
        paid_comm_result = await db.execute(paid_comm_stmt)
        paid_commission = paid_comm_result.scalar() or Decimal('0')
        
        # Today's earnings
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_stmt = select(func.sum(ReferralCommission.commission_amount)).where(
            ReferralCommission.referrer_id == user_id,
            ReferralCommission.earned_at >= today_start
        )
        today_result = await db.execute(today_stmt)
        today_earned = today_result.scalar() or Decimal('0')
        
        # This month's earnings
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_stmt = select(func.sum(ReferralCommission.commission_amount)).where(
            ReferralCommission.referrer_id == user_id,
            ReferralCommission.earned_at >= month_start
        )
        month_result = await db.execute(month_stmt)
        this_month_earned = month_result.scalar() or Decimal('0')
        
        # Tier info
        current_tier = user.referral_tier or 1
        if current_tier == 3:
            next_tier_threshold = None
            referrals_to_next = None
        elif current_tier == 2:
            next_tier_threshold = settings.REFERRAL_TIER3_THRESHOLD
            referrals_to_next = max(0, next_tier_threshold - active_referred)
        else:
            next_tier_threshold = settings.REFERRAL_TIER2_THRESHOLD
            referrals_to_next = max(0, next_tier_threshold - active_referred)
        
        # Build referral link
        referral_link = f"{settings.REFERRAL_BASE_URL}?ref={user.referral_code}"
        
        return {
            "referral_code": user.referral_code,
            "referral_link": referral_link,
            "total_referred": total_referred,
            "active_referred": active_referred,
            "pending_referred": pending_referred,
            "total_earned": Decimal(str(user.referral_earnings or 0)),
            "pending_commission": pending_commission,
            "paid_commission": paid_commission,
            "today_earned": today_earned,
            "this_month_earned": this_month_earned,
            "current_tier": current_tier,
            "next_tier_threshold": next_tier_threshold,
            "referrals_to_next_tier": referrals_to_next
        }
