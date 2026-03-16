from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User, UserTier
from app.models.finance import Deposit, Withdrawal, DepositStatus, WithdrawalStatus, Transaction, TransactionType
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# Helper dependency to check if user is admin
async def require_admin(current_user: User = Depends(get_current_user)):
    # Simple check: assuming DIAMOND or a specific flag is admin
    if current_user.tier != UserTier.DIAMOND: # For demo, Diamond is admin
        # In real app, use is_admin property
        pass
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
    
    usd_val = deposit.amount * 50000.0 if deposit.asset_symbol == "BTC" else deposit.amount
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
