from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import logging

from app.database import get_db
from app.models.user import User, UserTier
from app.models.finance import Deposit, Withdrawal, DepositStatus, WithdrawalStatus, Transaction, TransactionType
from app.models.mining import MiningPlan, MiningSubscription, MiningStatus
from app.models.settings import SystemSettings
from app.utils.auth import get_current_user
from app.utils.market import get_live_price
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

logger = logging.getLogger(__name__)

# Helper dependency to check if user is admin
async def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.tier != UserTier.DIAMOND:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/stats")
async def get_platform_stats(db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    """Get overall platform statistics for admin dashboard."""
    # Total Users
    user_stmt = select(func.count(User.id))
    user_count = (await db.execute(user_stmt)).scalar() or 0
    
    # Total Deposits
    dep_stmt = select(func.sum(Deposit.fiat_amount)).where(Deposit.status == DepositStatus.CONFIRMED)
    total_deposits = (await db.execute(dep_stmt)).scalar() or 0.0
    
    # Pending Actions
    pending_dep = select(func.count(Deposit.id)).where(Deposit.status == DepositStatus.PENDING)
    pending_with = select(func.count(Withdrawal.id)).where(Withdrawal.status == WithdrawalStatus.PENDING_APPROVAL)
    
    p_dep = (await db.execute(pending_dep)).scalar() or 0
    p_with = (await db.execute(pending_with)).scalar() or 0
    
    return {
        "total_users": user_count,
        "total_deposited": total_deposits,
        "pending_deposits": p_dep,
        "pending_withdrawals": p_with,
        "system_status": "ONLINE"
    }

@router.get("/users", response_model=List[dict])
async def list_users(db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    """List all registered users."""
    stmt = select(User).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [{"id": u.id, "email": u.email, "tier": u.tier, "status": u.status} for u in users]

@router.post("/deposits/{deposit_id}/approve")
async def approve_deposit(
    deposit_id: str,
    db: AsyncSession = Depends(get_db), 
    _ = Depends(require_admin)
):
    """Admin approves a pending deposit."""
    stmt = select(Deposit).where(Deposit.id == deposit_id)
    result = await db.execute(stmt)
    deposit = result.scalar_one_or_none()
    
    if not deposit or deposit.status != DepositStatus.PENDING:
        raise HTTPException(status_code=400, detail="Invalid deposit or already processed")
        
    deposit.status = DepositStatus.CONFIRMED
    deposit.confirmed_at = datetime.utcnow()
    
    # Credit User
    stmt = select(User).where(User.id == deposit.user_id)
    u_result = await db.execute(stmt)
    user = u_result.scalar_one()
    
    usd_val = deposit.amount
    if deposit.asset_symbol in ["BTC", "ETH"]:
        # Get real-time market price for conversion
        try:
            price = await get_live_price(deposit.asset_symbol)
            usd_val = deposit.amount * price
        except Exception as e:
            # Log price fetch failure and use conservative fallback
            logger.error(f"Failed to fetch live price for {deposit.asset_symbol} in deposit {deposit.id}: {str(e)}")
            # Use conservative fallback prices to avoid over-crediting
            fallback_prices = {"BTC": 25000.0, "ETH": 1500.0}  # Documented conservative fallbacks
            usd_val = deposit.amount * fallback_prices.get(deposit.asset_symbol, 1.0)
            logger.warning(f"Using fallback price for {deposit.asset_symbol}: ${fallback_prices.get(deposit.asset_symbol, 1.0)}")
    
    user.account_balance += usd_val
    user.trading_balance += usd_val
    
    await db.commit()
    return {"message": "Deposit approved and user credited"}

@router.post("/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(
    withdrawal_id: str,
    db: AsyncSession = Depends(get_db), 
    _ = Depends(require_admin)
):
    """Admin approves a pending withdrawal."""
    stmt = select(Withdrawal).where(Withdrawal.id == withdrawal_id)
    result = await db.execute(stmt)
    withdrawal = result.scalar_one_or_none()
    
    if not withdrawal or withdrawal.status != WithdrawalStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail="Invalid withdrawal or already processed")
        
    withdrawal.status = WithdrawalStatus.PROCESSING
    # In real app, trigger blockchain tx here
    
    await db.commit()
    return {"message": "Withdrawal approved and moved to processing"}

@router.get("/mining/subscriptions")
async def get_mining_subscriptions(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    """List mining subscriptions for admin review."""
    stmt = select(MiningSubscription, MiningPlan, User.email).join(
        MiningPlan, MiningSubscription.plan_id == MiningPlan.id
    ).join(User, MiningSubscription.user_id == User.id)
    
    if status:
        stmt = stmt.where(MiningSubscription.status == status)
        
    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        {
            "id": s.id,
            "user_email": email,
            "plan_name": p.name,
            "amount": p.price,
            "status": s.status,
            "created_at": s.created_at
        } for s, p, email in rows
    ]

@router.post("/mining/subscriptions/{sub_id}/approve")
async def approve_mining_subscription(
    sub_id: str,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    """Approve a pending mining subscription and start the mining period."""
    # First get the subscription, plan, and user
    stmt = select(MiningSubscription, MiningPlan, User).join(
        MiningPlan, MiningSubscription.plan_id == MiningPlan.id
    ).join(User, MiningSubscription.user_id == User.id).where(
        MiningSubscription.id == sub_id
    )
    
    result = await db.execute(stmt)
    row = result.one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    sub, plan, user = row
    
    if sub.status != MiningStatus.PENDING:
        raise HTTPException(status_code=400, detail="Subscription not pending")
    
    # Verify payment was received - check for a confirmed deposit from this user
    # matching or exceeding the plan price (use fiat_amount for USD comparison)
    payment_stmt = select(Deposit).where(
        Deposit.user_id == user.id,
        Deposit.status == DepositStatus.CONFIRMED,
        Deposit.fiat_amount >= plan.price  # Use USD equivalent for comparison
    ).order_by(Deposit.created_at.desc()).limit(1)
    
    payment_result = await db.execute(payment_stmt)
    payment = payment_result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=400, 
            detail="No confirmed payment found. Please verify payment before approving."
        )
    
    # Payment verified - activate subscription
    sub.status = MiningStatus.ACTIVE
    sub.start_date = datetime.utcnow()
    sub.end_date = sub.start_date + timedelta(days=plan.duration_days)
    
    await db.commit()
    return {"message": "Subscription approved. Mining has started."}

class MiningSettingsUpdateRequest(BaseModel):
    wallet_id: str
    qr_code_url: Optional[str] = None

@router.post("/mining/settings")
async def update_mining_settings(
    request: MiningSettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    """Update admin wallet settings for mining payments."""
    settings = {
        "mining_wallet_id": request.wallet_id,
        "mining_wallet_qr": request.qr_code_url
    }
    
    for key, value in settings.items():
        if value is None: continue
        stmt = select(SystemSettings).where(SystemSettings.key == key)
        result = await db.execute(stmt)
        record = result.scalar_one_or_none()
        
        if record:
            record.value = value
        else:
            db.add(SystemSettings(id=str(uuid.uuid4()), key=key, value=value))
            
    await db.commit()
    return {"message": "Mining settings updated successfully"}
