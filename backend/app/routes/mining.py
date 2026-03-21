from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
import logging
import uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.mining import MiningPlan, MiningSubscription, MiningStatus
from app.models.settings import SystemSettings
from app.models.mining_stats import MiningStats
from app.utils.auth import get_current_user
from app.schemas.mining import MiningPlanResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/mining", tags=["mining"])
logger = logging.getLogger(__name__)

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
    ends_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    admin_wallet_id: Optional[str] = None
    admin_wallet_qr: Optional[str] = None

@router.get("/plans", response_model=List[MiningPlanResponse])
async def get_mining_plans(db: AsyncSession = Depends(get_db)):
    """Get all available cloud mining plans with real-time profit calculations."""
    try:
        from app.services.profit_calculator import profit_calculator
        
        stmt = select(MiningPlan).where(MiningPlan.is_active == True)
        result = await db.execute(stmt)
        plans = result.scalars().all()
        
        # Calculate real-time profits for each plan
        plans_with_real_profits = []
        for plan in plans:
            plan_dict = {
                "id": plan.id,
                "name": plan.name,
                "coin_symbol": plan.coin_symbol,
                "hashrate": plan.hashrate,
                "daily_earnings": plan.daily_earnings,  # Will be updated
                "price": plan.price,
                "duration_days": plan.duration_days,
                "is_active": plan.is_active
            }
            
            # Calculate real-time profits
            updated_plan = await profit_calculator.calculate_real_profit(plan_dict)
            plans_with_real_profits.append(updated_plan)
        
        return [MiningPlanResponse(**p) for p in plans_with_real_profits]
        
    except Exception as e:
        logger.error(f"Error fetching mining plans: {e}")
        # Fallback to original plans if calculation fails
        stmt = select(MiningPlan).where(MiningPlan.is_active == True)
        result = await db.execute(stmt)
        plans = result.scalars().all()
        return [MiningPlanResponse(**p.__dict__) for p in plans]

@router.get("/stats")
async def get_mining_stats(coin: str = "BTC", db: AsyncSession = Depends(get_db)):
    """Get real-time mining network statistics for a specific coin."""
    stmt = select(MiningStats).where(MiningStats.coin_symbol == coin.upper())
    result = await db.execute(stmt)
    stats = result.scalar_one_or_none()
    
    if not stats:
        # Return fallback/empty stats if none cached yet
        return {
            "coin_symbol": coin.upper(),
            "difficulty": "N/A",
            "network_hashrate": "0 TH/s",
            "block_time_avg": 600.0,
            "market_price_usd": 0.0,
            "updated_at": datetime.utcnow()
        }
    
    return stats

@router.get("/stats/all")
async def get_all_mining_stats(db: AsyncSession = Depends(get_db)):
    """Get real-time mining statistics for all supported coins."""
    try:
        from app.services.mining_data import mining_data_service
        all_stats = await mining_data_service.fetch_all_coin_stats()
        return {
            "coins": all_stats,
            "total_supported": len(all_stats),
            "updated_at": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Error fetching all coin stats: {e}")
        return {
            "coins": [],
            "total_supported": 0,
            "error": str(e),
            "updated_at": datetime.utcnow()
        }

@router.post("/subscribe", response_model=MiningResponse)
async def subscribe_mining(
    request: MineRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Subscribe to a cloud mining plan (Starts as PENDING)."""
    logger.info(f"Subscription request received: {request.dict()}")
    print(f"DEBUG: Processing subscription for plan_id: {request.plan_id}")
    
    stmt = select(MiningPlan).where(MiningPlan.id == request.plan_id, MiningPlan.is_active == True)
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Mining plan not found")

    # Fetch Admin Wallet Info for Payment
    wallet_stmt = select(SystemSettings).where(SystemSettings.key.in_(["mining_wallet_id", "mining_wallet_qr"]))
    wallet_results = await db.execute(wallet_stmt)
    settings = {s.key: s.value for s in wallet_results.scalars().all()}

    # Create Subscription as PENDING
    sub_id = str(uuid.uuid4())
    
    new_sub = MiningSubscription(
        id=sub_id,
        user_id=current_user.id,
        plan_id=plan.id,
        status=MiningStatus.PENDING,
        total_earnings=0.0,
        start_date=datetime.utcnow(),
        # end_date will be set upon approval
    )
    
    db.add(new_sub)
    await db.commit()
    
    return MiningResponse(
        id=sub_id,
        plan_name=plan.name,
        coin_symbol=plan.coin_symbol,
        hashrate=plan.hashrate,
        daily_earnings=plan.daily_earnings,
        total_earnings=0.0,
        status=MiningStatus.PENDING,
        admin_wallet_id=settings.get("mining_wallet_id", "Setup Pending"),
        admin_wallet_qr=settings.get("mining_wallet_qr")
    )

@router.get("/my-mining", response_model=List[MiningResponse])
async def get_my_mining(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's mining subscriptions (Active and Pending)."""
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
            total_earnings=s.total_earnings or 0.0,
            status=s.status,
            ends_at=s.end_date,
            started_at=s.start_date
        ) for s, p in rows
    ]
