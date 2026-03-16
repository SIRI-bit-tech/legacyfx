from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.mining import MiningPlan, MiningSubscription
from app.utils.auth import get_current_user
from app.schemas.mining import MiningPlanResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/mining", tags=["mining"])

class MineRequest(BaseModel):
    plan_id: str

class MiningResponse(BaseModel):
    id: str
    plan_name: str
    coin_symbol: str
    hashrate: str
    daily_earnings: float
    total_earnings: float
    status: str
    ends_at: datetime
    started_at: datetime

@router.get("/plans", response_model=List[MiningPlanResponse])
async def get_mining_plans(db: AsyncSession = Depends(get_db)):
    """Get all available cloud mining plans."""
    stmt = select(MiningPlan).where(MiningPlan.is_active == True)
    result = await db.execute(stmt)
    plans = result.scalars().all()
    return [MiningPlanResponse.from_orm(p) for p in plans]

@router.post("/subscribe", response_model=MiningResponse)
async def subscribe_mining(
    request: MineRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Subscribe to a cloud mining plan."""
    stmt = select(MiningPlan).where(MiningPlan.id == request.plan_id, MiningPlan.is_active == True)
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Mining plan not found")
        
    if current_user.trading_balance < plan.price:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient trading balance")

    # Create Subscription
    sub_id = str(uuid.uuid4())
    started_at = datetime.utcnow()
    ends_at = started_at + timedelta(days=plan.duration_days)
    
    new_sub = MiningSubscription(
        id=sub_id,
        user_id=current_user.id,
        plan_id=plan.id,
        status="ACTIVE",
        total_earnings=0.0,
        started_at=started_at,
        ends_at=ends_at
    )
    
    # Deduct price
    current_user.trading_balance -= plan.price
    
    db.add(new_sub)
    await db.commit()
    
    return MiningResponse(
        id=sub_id,
        plan_name=plan.name,
        coin_symbol=plan.coin_symbol,
        hashrate=plan.hashrate,
        daily_earnings=plan.daily_earnings,
        total_earnings=0.0,
        status="ACTIVE",
        ends_at=ends_at,
        started_at=started_at
    )

@router.get("/my-mining", response_model=List[MiningResponse])
async def get_my_mining(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's active cloud mining subscriptions."""
    stmt = select(MiningSubscription, MiningPlan).join(
        MiningPlan, MiningSubscription.plan_id == MiningPlan.id
    ).where(MiningSubscription.user_id == current_user.id)
    
    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        MiningResponse(
            id=s.id,
            plan_name=p.name,
            coin_symbol=p.coin_symbol,
            hashrate=p.hashrate,
            daily_earnings=p.daily_earnings,
            total_earnings=s.total_earnings,
            status=s.status,
            ends_at=s.ends_at,
            started_at=s.started_at
        ) for s, p in rows
    ]
