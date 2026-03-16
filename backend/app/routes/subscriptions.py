from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User, UserTier
from app.models.finance import SubscriptionPlan, UserSubscription
from app.utils.auth import get_current_user
from app.schemas.finance import SubscriptionPlanResponse, UserSubscriptionResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])

class SubscribeRequest(BaseModel):
    plan_id: str

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def list_plans(db: AsyncSession = Depends(get_db)):
    """List available subscription plans."""
    stmt = select(SubscriptionPlan).where(SubscriptionPlan.is_active == True)
    result = await db.execute(stmt)
    plans = result.scalars().all()
    return [SubscriptionPlanResponse.from_orm(p) for p in plans]

@router.post("/subscribe")
async def subscribe_user(
    request: SubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Subscribe user to a plan."""
    stmt = select(SubscriptionPlan).where(SubscriptionPlan.id == request.plan_id, SubscriptionPlan.is_active == True)
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    if current_user.trading_balance < plan.price:
        raise HTTPException(status_code=400, detail="Insufficient trading balance")

    # Update User Tier
    if "VIP" in plan.name.upper():
        current_user.tier = UserTier.GOLD
    elif "ELITE" in plan.name.upper():
        current_user.tier = UserTier.PLATINUM
    elif "PREMIUM" in plan.name.upper():
        current_user.tier = UserTier.SILVER

    # Deduct price
    current_user.trading_balance -= plan.price
    
    # Create UserSubscription
    sub_id = str(uuid.uuid4())
    new_sub = UserSubscription(
        id=sub_id,
        user_id=current_user.id,
        plan_id=plan.id,
        status="ACTIVE",
        started_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    
    db.add(new_sub)
    await db.commit()
    
    return {"message": f"Successfully subscribed to {plan.name}", "new_tier": current_user.tier}

@router.get("/my-subscription")
async def get_my_subscription(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get user's current subscription details."""
    stmt = select(UserSubscription).where(UserSubscription.user_id == current_user.id, UserSubscription.status == "ACTIVE")
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
