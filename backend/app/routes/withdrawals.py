from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.finance import Withdrawal, WithdrawalStatus, Transaction, TransactionType
from app.utils.auth import get_current_user
from app.services.email import EmailService
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/withdrawals", tags=["withdrawals"])

class WithdrawalRequest(BaseModel):
    asset_symbol: str
    amount: float
    destination_address: str
    blockchain_network: Optional[str] = "ERC20"
    two_fa_code: Optional[str] = None

class WithdrawalResponse(BaseModel):
    id: str
    asset_symbol: str
    amount: float
    fee: float
    net_amount: float
    status: str
    created_at: datetime

@router.post("/request", response_model=WithdrawalResponse)
async def request_withdrawal(
    request: WithdrawalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Request a withdrawal of assets."""
    # 1. Check if user has enough balance
    # (Checking account_balance for simplicity, in real app check UserAsset)
    usd_rate = 50000.0 if request.asset_symbol.upper() == "BTC" else 1.0
    usd_value = request.amount * usd_rate
    
    if current_user.trading_balance < usd_value:
         raise HTTPException(status_code=400, detail="Insufficient trading balance")

    # 2. Email-confirm-first flow:
    # We lock funds now and only proceed after email confirmation.

    # 3. Create Withdrawal record
    withdrawal_id = str(uuid.uuid4())
    fee = request.amount * 0.001 # 0.1% fee
    net_amount = request.amount - fee
    
    confirmation_token = str(uuid.uuid4())
    confirmation_expires_at = datetime.utcnow() + timedelta(hours=1)
    
    new_withdrawal = Withdrawal(
        id=withdrawal_id,
        user_id=current_user.id,
        asset_symbol=request.asset_symbol.upper(),
        amount=request.amount,
        fee=fee,
        net_amount=net_amount,
        destination_address=request.destination_address,
        blockchain_network=request.blockchain_network,
        status=WithdrawalStatus.AWAITING_CONFIRMATION,
        confirmation_token=confirmation_token,
        confirmation_expires_at=confirmation_expires_at,
    )
    
    # 4. Deduct balance (lock it)
    current_user.trading_balance -= usd_value
    current_user.account_balance -= usd_value
    
    # 5. Record Transaction
    txn = Transaction(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        type=TransactionType.WITHDRAWAL,
        asset_symbol=request.asset_symbol.upper(),
        amount=-request.amount,
        usd_amount=-usd_value,
        description=f"Withdrawal {request.asset_symbol}",
        reference_id=withdrawal_id
    )
    
    db.add(new_withdrawal)
    db.add(txn)
    await db.commit()

    # Send confirmation email (best-effort). Funds remain locked until confirmation.
    try:
        await EmailService.send_withdrawal_confirmation(
            email=current_user.email,
            amount=str(request.amount),
            currency=request.asset_symbol.upper(),
            token=confirmation_token,
        )
    except Exception:
        pass
    
    return WithdrawalResponse(
        id=withdrawal_id,
        asset_symbol=request.asset_symbol.upper(),
        amount=request.amount,
        fee=fee,
        net_amount=net_amount,
        status=WithdrawalStatus.AWAITING_CONFIRMATION.value,
        created_at=datetime.utcnow()
    )

@router.get("/history", response_model=List[WithdrawalResponse])
async def get_withdrawal_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's withdrawal history."""
    stmt = select(Withdrawal).where(Withdrawal.user_id == current_user.id).order_by(Withdrawal.created_at.desc())
    result = await db.execute(stmt)
    withdrawals = result.scalars().all()
    
    return [
        WithdrawalResponse(
            id=w.id,
            asset_symbol=w.asset_symbol,
            amount=w.amount,
            fee=w.fee,
            net_amount=w.net_amount,
            status=w.status.value,
            created_at=w.created_at
        ) for w in withdrawals
    ]

@router.post("/{withdrawal_id}/cancel")
async def cancel_withdrawal(
    withdrawal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a pending withdrawal request."""
    stmt = select(Withdrawal).where(Withdrawal.id == withdrawal_id, Withdrawal.user_id == current_user.id)
    result = await db.execute(stmt)
    withdrawal = result.scalar_one_or_none()
    
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    
    if withdrawal.status not in [WithdrawalStatus.PENDING_2FA, WithdrawalStatus.AWAITING_CONFIRMATION, WithdrawalStatus.PENDING_APPROVAL]:
        raise HTTPException(status_code=400, detail="Only pending withdrawals can be cancelled")
        
    withdrawal.status = WithdrawalStatus.CANCELLED
    
    # Refund balance
    usd_rate = 50000.0 if withdrawal.asset_symbol == "BTC" else 1.0
    usd_value = withdrawal.amount * usd_rate
    current_user.trading_balance += usd_value
    current_user.account_balance += usd_value
    
    await db.commit()
    return {"message": "Withdrawal cancelled and balance refunded"}


@router.post("/confirm")
async def confirm_withdrawal(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Confirm a pending withdrawal using an email confirmation token."""
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")

    stmt = select(Withdrawal).where(Withdrawal.confirmation_token == token)
    result = await db.execute(stmt)
    withdrawal = result.scalar_one_or_none()

    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal confirmation not found")

    if withdrawal.status != WithdrawalStatus.AWAITING_CONFIRMATION:
        raise HTTPException(status_code=400, detail="Withdrawal is not awaiting confirmation")

    if withdrawal.confirmation_expires_at and withdrawal.confirmation_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Withdrawal confirmation token has expired")

    withdrawal.status = WithdrawalStatus.PENDING_APPROVAL
    withdrawal.approved_at = datetime.utcnow()
    await db.commit()

    return {"message": "Withdrawal confirmed and moved to pending approval"}
