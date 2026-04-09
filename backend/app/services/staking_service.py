"""Staking service for managing pools, positions, and rewards"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
import logging

from app.models.staking import (
    StakingProduct, StakingPosition, StakingReward, 
    StakingType, PayoutFrequency, RewardStatus, RewardType
)
from app.models.user import User
from app.models.finance import Transaction, TransactionType
from app.schemas.staking import (
    StakingPoolResponse, StakingPositionResponse, StakingStatsResponse,
    StakingRewardResponse, StakingScheduleResponse
)

logger = logging.getLogger(__name__)

class StakingService:
    """Service layer for staking operations"""
    
    @staticmethod
    async def get_all_pools(
        db: AsyncSession,
        filter_type: Optional[str] = None,
        is_active_only: bool = True
    ) -> List[StakingPoolResponse]:
        """Get all staking pools with optional type filter"""
        stmt = select(StakingProduct)
        
        if is_active_only:
            stmt = stmt.where(StakingProduct.is_active == True)
        
        if filter_type:
            stmt = stmt.where(StakingProduct.staking_type == filter_type)
        
        result = await db.execute(stmt)
        pools = result.scalars().all()
        
        # Enrich with calculated fields
        pools_response = []
        for pool in pools:
            # Calculate capacity percentage
            available_pct = None
            if pool.pool_capacity_amount:
                available_pct = ((pool.pool_capacity_amount - pool.current_total_staked) / 
                               pool.pool_capacity_amount * 100)
            
            # Count active users
            user_count_stmt = select(func.count(StakingPosition.id)).where(
                and_(StakingPosition.pool_id == pool.id, StakingPosition.is_active == True)
            )
            user_count_result = await db.execute(user_count_stmt)
            user_count = user_count_result.scalar() or 0
            
            pool_response = StakingPoolResponse(
                id=pool.id,
                asset_symbol=pool.asset_symbol,
                staking_type=pool.staking_type,
                annual_percentage_yield=pool.annual_percentage_yield,
                min_stake_amount=pool.min_stake_amount,
                lock_period_days=pool.lock_period_days,
                payout_frequency=pool.payout_frequency,
                pool_capacity_amount=pool.pool_capacity_amount,
                current_total_staked=pool.current_total_staked,
                available_capacity_pct=available_pct,
                total_users_staking=user_count,
                is_active=pool.is_active,
                created_at=pool.created_at
            )
            pools_response.append(pool_response)
        
        return pools_response
    
    @staticmethod
    async def get_pool_by_id(db: AsyncSession, pool_id: str) -> Optional[StakingProduct]:
        """Get single pool by ID"""
        stmt = select(StakingProduct).where(StakingProduct.id == pool_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def stake(
        db: AsyncSession,
        user_id: str,
        pool_id: str,
        amount: float
    ) -> StakingPosition:
        """Create new staking position"""
        
        # Get pool
        pool = await StakingService.get_pool_by_id(db, pool_id)
        if not pool or not pool.is_active:
            raise ValueError("Pool not found or inactive")
        
        # Validate amount
        if amount < pool.min_stake_amount:
            raise ValueError(f"Minimum stake amount is {pool.min_stake_amount}")
        
        # Check pool capacity
        if pool.pool_capacity_amount and pool.current_total_staked + amount > pool.pool_capacity_amount:
            raise ValueError("Pool capacity exceeded")
        
        # Check user balance
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user or user.trading_balance < amount:
            raise ValueError("Insufficient trading balance")
        
        # Calculate earned_until_date for fixed terms
        earned_until_date = None
        if pool.lock_period_days:
            earned_until_date = datetime.utcnow() + timedelta(days=pool.lock_period_days)
        
        # Create staking position
        position = StakingPosition(
            user_id=user_id,
            pool_id=pool_id,
            amount_staked=amount,
            usd_value_at_staking=amount,  # Simplified - in production would use price feed
            started_at=datetime.utcnow(),
            earned_until_date=earned_until_date,
            is_active=True
        )
        
        # Deduct from trading balance
        user.trading_balance -= amount
        pool.current_total_staked += amount
        
        # Record transaction
        transaction = Transaction(
            user_id=user_id,
            transaction_type=TransactionType.COLD_STORAGE_DEPOSIT if False else TransactionType.STAKE,  # STAKE type if exists
            asset_symbol=pool.asset_symbol,
            amount=amount,
            usd_amount=amount,
            reference_id=None  # Will be set to position.id after insert
        )
        
        db.add(position)
        db.add(transaction)
        
        await db.flush()
        
        transaction.reference_id = position.id
        await db.commit()
        await db.refresh(position)
        
        logger.info(f"User {user_id} staked {amount} to pool {pool_id}")
        
        return position
    
    @staticmethod
    async def unstake(db: AsyncSession, user_id: str, position_id: str) -> float:
        """Unstake from position and return principal + earned rewards"""
        
        # Get position
        stmt = select(StakingPosition).where(StakingPosition.id == position_id)
        result = await db.execute(stmt)
        position = result.scalar_one_or_none()
        
        if not position or position.user_id != user_id:
            raise ValueError("Position not found")
        
        if not position.is_active:
            raise ValueError("Position is not active")
        
        # Get pool
        pool = await StakingService.get_pool_by_id(db, position.pool_id)
        
        # Check if locked (for fixed terms)
        if pool and pool.lock_period_days and position.earned_until_date:
            if position.earned_until_date > datetime.utcnow():
                raise ValueError("Position is locked until " + position.earned_until_date.isoformat())
        
        # Calculate total earned
        reward_stmt = select(func.sum(StakingReward.amount)).where(
            and_(
                StakingReward.position_id == position_id,
                StakingReward.status.in_([RewardStatus.ACCRUED, RewardStatus.PAID, RewardStatus.CLAIMED])
            )
        )
        reward_result = await db.execute(reward_stmt)
        earned = reward_result.scalar() or 0.0
        
        # Total to return
        total_return = position.amount_staked + earned
        
        # Update user balance
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        user.trading_balance += total_return
        
        # Update position
        position.is_active = False
        position.closed_at = datetime.utcnow()
        position.total_earned_amount = earned
        
        # Update pool
        pool.current_total_staked -= position.amount_staked
        
        await db.commit()
        
        logger.info(f"User {user_id} unstaked {position.amount_staked} from position {position_id}, earned {earned}")
        
        return total_return
    
    @staticmethod
    async def get_user_stats(db: AsyncSession, user_id: str) -> StakingStatsResponse:
        """Get user's overall staking statistics"""
        
        # Get all active positions for user
        positions_stmt = select(StakingPosition).where(
            and_(StakingPosition.user_id == user_id, StakingPosition.is_active == True)
        )
        positions_result = await db.execute(positions_stmt)
        positions = positions_result.scalars().all()
        
        # Total staked
        total_staked = sum(p.amount_staked for p in positions)
        active_count = len(positions)
        
        # Total earned (all reward statuses)
        rewards_stmt = select(func.sum(StakingReward.amount)).where(
            and_(
                StakingReward.position_id.in_(select(StakingPosition.id).where(StakingPosition.user_id == user_id)),
                StakingReward.status != RewardStatus.ACCRUED
            )
        )
        rewards_result = await db.execute(rewards_stmt)
        total_earned = rewards_result.scalar() or 0.0
        
        # Claimable now (ACCRUED status)
        claimable_stmt = select(func.sum(StakingReward.amount)).where(
            and_(
                StakingReward.position_id.in_(select(StakingPosition.id).where(StakingPosition.user_id == user_id)),
                StakingReward.status == RewardStatus.ACCRUED
            )
        )
        claimable_result = await db.execute(claimable_stmt)
        claimable_now = claimable_result.scalar() or 0.0
        
        # Calculate average APY
        avg_apy = 0.0
        if total_staked > 0 and active_count > 0:
            pools = [p.pool for p in positions]
            avg_apy = sum(p.annual_percentage_yield for p in pools) / active_count
        
        # Projected annual earnings
        annual_projected = total_staked * (avg_apy / 100) if avg_apy > 0 else 0
        
        # Earned today and this month (simplified)
        today_stmt = select(func.sum(StakingReward.amount)).where(
            and_(
                StakingReward.position_id.in_(select(StakingPosition.id).where(StakingPosition.user_id == user_id)),
                StakingReward.earned_on_date >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            )
        )
        today_result = await db.execute(today_stmt)
        earned_today = today_result.scalar() or 0.0
        
        month_ago = datetime.utcnow() - timedelta(days=30)
        month_stmt = select(func.sum(StakingReward.amount)).where(
            and_(
                StakingReward.position_id.in_(select(StakingPosition.id).where(StakingPosition.user_id == user_id)),
                StakingReward.earned_on_date >= month_ago
            )
        )
        month_result = await db.execute(month_stmt)
        earned_month = month_result.scalar() or 0.0
        
        # Next payout date
        next_payout = None
        if positions:
            next_payout_stmt = select(func.min(StakingReward.earned_on_date)).where(
                and_(
                    StakingReward.position_id.in_(select(StakingPosition.id).where(StakingPosition.user_id == user_id)),
                    StakingReward.earned_on_date > datetime.utcnow()
                )
            )
            next_payout_result = await db.execute(next_payout_stmt)
            next_payout = next_payout_result.scalar()
        
        return StakingStatsResponse(
            total_staked_usd=total_staked,
            total_earned_usd=total_earned + claimable_now,
            avg_apy=round(avg_apy, 2),
            claimable_now=claimable_now,
            active_stakes_count=active_count,
            next_payout_date=next_payout,
            annual_projected_earnings=annual_projected,
            earned_today=earned_today,
            earned_this_month=earned_month
        )
    
    @staticmethod
    async def claim_rewards(
        db: AsyncSession,
        user_id: str,
        position_id: Optional[str] = None
    ) -> float:
        """Claim all accrued rewards for user"""
        
        # Get rewards to claim
        if position_id:
            rewards_stmt = select(StakingReward).where(
                and_(
                    StakingReward.position_id == position_id,
                    StakingReward.status == RewardStatus.ACCRUED
                )
            )
        else:
            rewards_stmt = select(StakingReward).where(
                and_(
                    StakingReward.position_id.in_(
                        select(StakingPosition.id).where(StakingPosition.user_id == user_id)
                    ),
                    StakingReward.status == RewardStatus.ACCRUED
                )
            )
        
        rewards_result = await db.execute(rewards_stmt)
        rewards = rewards_result.scalars().all()
        
        if not rewards:
            raise ValueError("No accrued rewards to claim")
        
        total_claimed = sum(r.amount for r in rewards)
        
        # Update reward status
        for reward in rewards:
            reward.status = RewardStatus.CLAIMED
            reward.paid_on_date = datetime.utcnow()
        
        # Add to user balance
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        user.trading_balance += total_claimed
        
        await db.commit()
        
        logger.info(f"User {user_id} claimed {total_claimed} in rewards")
        
        return total_claimed
    
    @staticmethod
    async def get_user_stakes(
        db: AsyncSession,
        user_id: str
    ) -> List[StakingPositionResponse]:
        """Get user's active staking positions"""
        
        stmt = select(StakingPosition).where(
            and_(StakingPosition.user_id == user_id, StakingPosition.is_active == True)
        ).order_by(StakingPosition.started_at.desc())
        
        result = await db.execute(stmt)
        positions = result.scalars().all()
        
        positions_response = []
        for position in positions:
            pool = position.pool
            
            # Calculate earned so far
            earned_stmt = select(func.sum(StakingReward.amount)).where(
                and_(
                    StakingReward.position_id == position.id,
                    StakingReward.status.in_([RewardStatus.ACCRUED, RewardStatus.PAID, RewardStatus.CLAIMED])
                )
            )
            earned_result = await db.execute(earned_stmt)
            earned_so_far = earned_result.scalar() or 0.0
            
            # Calculate annual earning rate
            annual_rate = (position.amount_staked * pool.annual_percentage_yield) / 365 if pool else 0
            
            # Determine if locked
            is_locked = False
            if pool and pool.lock_period_days and position.earned_until_date:
                is_locked = position.earned_until_date > datetime.utcnow()
            
            pos_response = StakingPositionResponse(
                id=position.id,
                pool_id=position.pool_id,
                asset_symbol=pool.asset_symbol if pool else "UNKNOWN",
                amount_staked=position.amount_staked,
                total_earned_amount=position.total_earned_amount,
                earned_so_far=earned_so_far,
                next_payout_date=position.earned_until_date,
                annual_earning_rate=annual_rate,
                status=position.status.value if hasattr(position.status, 'value') else str(position.status),
                is_active=position.is_active,
                is_locked=is_locked,
                started_at=position.started_at,
                earned_until_date=position.earned_until_date
            )
            positions_response.append(pos_response)
        
        return positions_response
    
    @staticmethod
    async def get_user_rewards_history(
        db: AsyncSession,
        user_id: str,
        limit: int = 50
    ) -> List[StakingRewardResponse]:
        """Get user's reward history"""
        
        stmt = select(StakingReward).where(
            StakingReward.position_id.in_(
                select(StakingPosition.id).where(StakingPosition.user_id == user_id)
            )
        ).order_by(StakingReward.earned_on_date.desc()).limit(limit)
        
        result = await db.execute(stmt)
        rewards = result.scalars().all()
        
        return [
            StakingRewardResponse(
                id=r.id,
                amount=r.amount,
                earned_on_date=r.earned_on_date,
                paid_on_date=r.paid_on_date,
                status=r.status.value if hasattr(r.status, 'value') else str(r.status),
                reward_type=r.reward_type.value if hasattr(r.reward_type, 'value') else str(r.reward_type)
            )
            for r in rewards
        ]
    
    @staticmethod
    async def get_payout_schedule(
        db: AsyncSession,
        user_id: str
    ) -> List[StakingScheduleResponse]:
        """Get upcoming payout schedule for user's active positions"""
        
        # Get user's active positions with their products
        stmt = select(StakingPosition, StakingProduct).join(
            StakingProduct, StakingPosition.pool_id == StakingProduct.id
        ).where(
            StakingPosition.user_id == user_id,
            StakingPosition.is_active == True
        )
        
        result = await db.execute(stmt)
        rows = result.all()
        
        schedule = []
        now = datetime.utcnow()
        
        for position, product in rows:
            # Calculate next payout date based on frequency
            last_payout = position.last_payout_at or position.started_at
            
            if product.payout_frequency == PayoutFrequency.DAILY:
                next_payout = last_payout + timedelta(days=1)
            elif product.payout_frequency == PayoutFrequency.MONTHLY:
                # Add one month (approximate)
                next_month = last_payout.month + 1
                next_year = last_payout.year
                if next_month > 12:
                    next_month = 1
                    next_year += 1
                next_payout = last_payout.replace(year=next_year, month=next_month)
            elif product.payout_frequency == PayoutFrequency.END_OF_TERM:
                next_payout = position.earned_until_date
            else:
                continue
            
            # Only include future payouts
            if next_payout > now:
                # Calculate estimated earned amount
                days_staked = (now - position.started_at).days
                annual_earnings = position.amount_staked * (product.annual_percentage_yield / 100)
                daily_earnings = annual_earnings / 365
                estimated_earned = daily_earnings * days_staked
                
                schedule.append(StakingScheduleResponse(
                    position_id=position.id,
                    asset="USDT",  # Assuming USDT for now, can be extended
                    next_payout_date=next_payout,
                    estimated_amount=estimated_earned,
                    frequency=product.payout_frequency.value if hasattr(product.payout_frequency, 'value') else str(product.payout_frequency)
                ))
        
        # Sort by next payout date
        schedule.sort(key=lambda x: x.next_payout_date)
        
        return schedule
    
    # ========================================================================
    # ADMIN ENDPOINTS
    # ========================================================================
    
    @staticmethod
    async def create_pool(
        db: AsyncSession,
        asset_symbol: str,
        staking_type: str,
        annual_percentage_yield: float,
        min_stake_amount: float,
        lock_period_days: int,
        payout_frequency: str,
        pool_capacity_amount: float
    ) -> str:
        """Create a new staking pool (admin only)"""
        
        # Validate inputs
        if not asset_symbol or annual_percentage_yield <= 0 or pool_capacity_amount <= 0:
            raise ValueError("Invalid pool parameters")
        
        # Create new pool
        new_pool = StakingProduct(
            asset_symbol=asset_symbol,
            staking_type=staking_type,
            annual_percentage_yield=annual_percentage_yield,
            min_stake_amount=min_stake_amount,
            lock_period_days=lock_period_days,
            payout_frequency=payout_frequency,
            pool_capacity_amount=pool_capacity_amount,
            current_total_staked=0.0,
            is_active=True
        )
        
        db.add(new_pool)
        await db.flush()
        
        logger.info(f"Created staking pool: {new_pool.id}")
        return new_pool.id
    
    @staticmethod
    async def update_pool(
        db: AsyncSession,
        pool_id: str,
        **kwargs
    ) -> bool:
        """Update staking pool (admin only)"""
        
        # Get pool
        pool = await StakingService.get_pool_by_id(db, pool_id)
        if not pool:
            raise ValueError("Pool not found")
        
        # Allowed fields to update
        allowed_fields = {
            'annual_percentage_yield', 'min_stake_amount', 
            'pool_capacity_amount', 'is_active', 'payout_frequency'
        }
        
        # Update fields
        updated_count = 0
        for key, value in kwargs.items():
            if key in allowed_fields and value is not None:
                setattr(pool, key, value)
                updated_count += 1
        
        if updated_count > 0:
            await db.flush()
            logger.info(f"Updated staking pool {pool_id}")
        
        return updated_count > 0
