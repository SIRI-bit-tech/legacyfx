from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/referrals", tags=["referrals"])

class ReferralStatsResponse(BaseModel):
    referral_code: str
    total_referrals: int
    active_referrals: int
    total_earnings: float
    referral_link: str

class ReferredUserResponse(BaseModel):
    id: str
    username: str
    tier: str
    created_at: datetime
    status: str

@router.get("/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get user's referral statistics."""
    # Count referrals where referred_by == current_user.id
    stmt = select(func.count(User.id)).where(User.referred_by == current_user.id)
    result = await db.execute(stmt)
    total_count = result.scalar() or 0
    
    return ReferralStatsResponse(
        referral_code=current_user.referral_code,
        total_referrals=total_count,
        active_referrals=total_count, # Mock active
        total_earnings=current_user.referral_earnings,
        referral_link=f"https://legacyfx.com/signup?ref={current_user.referral_code}"
    )

@router.get("/my-referrals", response_model=List[ReferredUserResponse])
async def get_my_referrals(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get list of users referred by the current user."""
    stmt = select(User).where(User.referred_by == current_user.id).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    return [
        ReferredUserResponse(
            id=u.id,
            username=u.username or u.email.split('@')[0],
            tier=u.tier.value if hasattr(u.tier, 'value') else u.tier,
            created_at=u.created_at,
            status=u.status.value if hasattr(u.status, 'value') else u.status
        ) for u in users
    ]
