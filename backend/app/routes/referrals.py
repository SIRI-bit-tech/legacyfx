from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import math

from app.database import get_db
from app.models.user import User
from app.models.referral import Referral, ReferralCommission, ReferralPayout, ReferralStatus, CommissionStatus
from app.utils.auth import get_current_user
from app.schemas.referral import (
    ReferralStatsResponse, ReferredUserResponse, ReferredUsersListResponse,
    CommissionHistoryResponse, CommissionListResponse,
    PayoutHistoryResponse, PayoutListResponse,
    LeaderboardResponse, LeaderboardEntry
)
from app.services.referral_service import ReferralService

router = APIRouter(prefix="/api/v1/referrals", tags=["referrals"])


@router.get("/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's comprehensive referral statistics."""
    try:
        stats = await ReferralService.get_referral_stats(current_user.id, db)
        return ReferralStatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")


@router.get("/referred-users", response_model=ReferredUsersListResponse)
async def get_referred_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get paginated list of referred users."""
    try:
        # Build query
        stmt = select(Referral, User).join(
            User, Referral.referred_id == User.id
        ).where(Referral.referrer_id == current_user.id)
        
        # Apply status filter
        if status_filter:
            stmt = stmt.where(Referral.status == status_filter.upper())
        
        stmt = stmt.order_by(desc(Referral.joined_at))
        
        # Count total
        count_stmt = select(func.count(Referral.id)).where(Referral.referrer_id == current_user.id)
        if status_filter:
            count_stmt = count_stmt.where(Referral.status == status_filter.upper())
        
        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)
        
        result = await db.execute(stmt)
        rows = result.all()
        
        # Build response
        users = []
        for referral, user in rows:
            # Count trades for this user
            from app.models.trade import Trade
            trade_stmt = select(func.count(Trade.id)).where(Trade.user_id == user.id)
            trade_result = await db.execute(trade_stmt)
            total_trades = trade_result.scalar() or 0
            
            # Sum commissions earned from this user
            comm_stmt = select(func.sum(ReferralCommission.commission_amount)).where(
                ReferralCommission.referred_id == user.id,
                ReferralCommission.referrer_id == current_user.id
            )
            comm_result = await db.execute(comm_stmt)
            commission_earned = comm_result.scalar() or Decimal('0')
            
            # Mask email
            email_parts = user.email.split('@')
            masked_email = f"{email_parts[0][0]}***@{email_parts[1]}" if len(email_parts) == 2 else user.email
            
            users.append(ReferredUserResponse(
                id=user.id,
                email=masked_email,
                joined_date=referral.joined_at,
                status=referral.status.value,
                total_trades=total_trades,
                commission_earned=commission_earned,
                last_activity=user.last_login
            ))
        
        total_pages = math.ceil(total / limit) if total > 0 else 1
        
        return ReferredUsersListResponse(
            users=users,
            total=total,
            page=page,
            total_pages=total_pages
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch referred users: {str(e)}")


@router.get("/commissions", response_model=CommissionListResponse)
async def get_commission_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get paginated commission history."""
    try:
        # Build query
        stmt = select(ReferralCommission, User).join(
            User, ReferralCommission.referred_id == User.id
        ).where(ReferralCommission.referrer_id == current_user.id)
        
        # Apply status filter
        if status_filter:
            stmt = stmt.where(ReferralCommission.status == status_filter.upper())
        
        stmt = stmt.order_by(desc(ReferralCommission.earned_at))
        
        # Count total
        count_stmt = select(func.count(ReferralCommission.id)).where(
            ReferralCommission.referrer_id == current_user.id
        )
        if status_filter:
            count_stmt = count_stmt.where(ReferralCommission.status == status_filter.upper())
        
        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)
        
        result = await db.execute(stmt)
        rows = result.all()
        
        # Build response
        commissions = []
        for commission, user in rows:
            # Mask email
            email_parts = user.email.split('@')
            masked_email = f"{email_parts[0][0]}***@{email_parts[1]}" if len(email_parts) == 2 else user.email
            
            commissions.append(CommissionHistoryResponse(
                id=commission.id,
                source_user_email=masked_email,
                source_type=commission.source_type.value,
                source_amount=commission.source_amount,
                commission_rate=commission.commission_rate,
                commission_amount=commission.commission_amount,
                status=commission.status.value,
                earned_at=commission.earned_at
            ))
        
        total_pages = math.ceil(total / limit) if total > 0 else 1
        
        return CommissionListResponse(
            commissions=commissions,
            total=total,
            page=page,
            total_pages=total_pages
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch commissions: {str(e)}")


@router.get("/payouts", response_model=PayoutListResponse)
async def get_payout_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get paginated payout history."""
    try:
        # Build query
        stmt = select(ReferralPayout).where(
            ReferralPayout.referrer_id == current_user.id
        ).order_by(desc(ReferralPayout.payout_date))
        
        # Count total
        count_stmt = select(func.count(ReferralPayout.id)).where(
            ReferralPayout.referrer_id == current_user.id
        )
        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)
        
        result = await db.execute(stmt)
        payouts = result.scalars().all()
        
        # Build response
        payout_list = [
            PayoutHistoryResponse(
                id=p.id,
                payout_date=p.payout_date,
                commission_count=p.commission_count,
                total_amount=p.total_amount,
                status=p.status.value,
                paid_at=p.paid_at
            ) for p in payouts
        ]
        
        total_pages = math.ceil(total / limit) if total > 0 else 1
        
        return PayoutListResponse(
            payouts=payout_list,
            total=total,
            page=page,
            total_pages=total_pages
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payouts: {str(e)}")


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get top 10 referrers leaderboard (public endpoint)."""
    try:
        # Get top 10 referrers by active referral count
        stmt = select(
            User.id,
            User.first_name,
            User.last_name,
            User.created_at,
            func.count(Referral.id).label('referral_count')
        ).join(
            Referral, User.id == Referral.referrer_id
        ).where(
            Referral.status == ReferralStatus.ACTIVE
        ).group_by(
            User.id, User.first_name, User.last_name, User.created_at
        ).order_by(
            desc('referral_count')
        ).limit(10)
        
        result = await db.execute(stmt)
        rows = result.all()
        
        # Build leaderboard
        leaders = []
        current_user_rank = None
        
        for idx, row in enumerate(rows, start=1):
            # Mask name (First name + last initial)
            first_name = row.first_name or "User"
            last_initial = row.last_name[0] if row.last_name else ""
            masked_name = f"{first_name} {last_initial}." if last_initial else first_name
            
            # Format joined month
            joined_month = row.created_at.strftime("%b %Y") if row.created_at else "Unknown"
            
            leaders.append(LeaderboardEntry(
                rank=idx,
                name=masked_name,
                total_referred=row.referral_count,
                joined_month=joined_month
            ))
            
            # Check if current user is in leaderboard
            if current_user and row.id == current_user.id:
                current_user_rank = idx
        
        return LeaderboardResponse(
            leaders=leaders,
            current_user_rank=current_user_rank
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch leaderboard: {str(e)}")
