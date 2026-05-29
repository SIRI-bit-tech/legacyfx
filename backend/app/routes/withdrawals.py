from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)

from app.database import get_db
from app.models.user import User
from app.models.finance import Withdrawal, WithdrawalStatus, Transaction, TransactionType
from app.utils.auth import get_current_user
from app.services.email import EmailService
from pydantic import BaseModel
from app.core.rate_limit import limiter

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
@limiter.limit("2/minute")
async def request_withdrawal(
    request: Request,
    withdrawal_data: WithdrawalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Request a withdrawal of assets."""
    usd_rate = 50000.0 if withdrawal_data.asset_symbol.upper() == "BTC" else 1.0
    usd_value = withdrawal_data.amount * usd_rate
    
    if current_user.trading_balance < usd_value:
         raise HTTPException(status_code=400, detail="Insufficient trading balance")

    withdrawal_id = str(uuid.uuid4())
    fee = withdrawal_data.amount * 0.001 
    net_amount = withdrawal_data.amount - fee
    
    confirmation_token = str(uuid.uuid4())
    confirmation_expires_at = datetime.utcnow() + timedelta(hours=1)
    
    new_withdrawal = Withdrawal(
        id=withdrawal_id,
        user_id=current_user.id,
        asset_symbol=withdrawal_data.asset_symbol.upper(),
        amount=withdrawal_data.amount,
        fee=fee,
        net_amount=net_amount,
        destination_address=withdrawal_data.destination_address,
        blockchain_network=withdrawal_data.blockchain_network,
        status=WithdrawalStatus.AWAITING_CONFIRMATION,
        confirmation_token=confirmation_token,
        confirmation_expires_at=confirmation_expires_at,
    )
    
    current_user.trading_balance -= usd_value
    current_user.account_balance -= usd_value
    
    txn = Transaction(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        type=TransactionType.WITHDRAWAL,
        asset_symbol=withdrawal_data.asset_symbol.upper(),
        amount=-withdrawal_data.amount,
        usd_amount=-usd_value,
        description=f"Withdrawal {withdrawal_data.asset_symbol}",
        reference_id=withdrawal_id
    )
    
    db.add(new_withdrawal)
    db.add(txn)
    await db.commit()

    try:
        await EmailService.send_withdrawal_confirmation(
            email=current_user.email,
            amount=str(withdrawal_data.amount),
            currency=withdrawal_data.asset_symbol.upper(),
            token=confirmation_token,
        )
    except Exception as e:
        logger.error(f"Failed to send withdrawal confirmation email for {withdrawal_id}: {str(e)}")
        new_withdrawal.status = WithdrawalStatus.CANCELLED
        new_withdrawal.confirmation_token = None 
        txn.status = "FAILED"
        current_user.trading_balance += usd_value
        current_user.account_balance += usd_value
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send confirmation email. Withdrawal has been cancelled and funds restored."
        )
    
    return WithdrawalResponse(
        id=withdrawal_id,
        asset_symbol=withdrawal_data.asset_symbol.upper(),
        amount=withdrawal_data.amount,
        fee=fee,
        net_amount=net_amount,
        status=WithdrawalStatus.AWAITING_CONFIRMATION.value,
        created_at=datetime.utcnow()
    )

@router.get("/history", response_model=List[WithdrawalResponse])
@limiter.limit("10/minute")
async def get_withdrawal_history(
    request: Request,
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
@limiter.limit("5/minute")
async def cancel_withdrawal(
    request: Request,
    withdrawal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a pending withdrawal request."""
    stmt = select(Withdrawal).where(
        Withdrawal.id == withdrawal_id, 
        Withdrawal.user_id == current_user.id
    ).with_for_update()
    
    result = await db.execute(stmt)
    withdrawal = result.scalar_one_or_none()
    
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    
    if withdrawal.status not in [WithdrawalStatus.PENDING_2FA, WithdrawalStatus.AWAITING_CONFIRMATION, WithdrawalStatus.PENDING_APPROVAL]:
        raise HTTPException(status_code=400, detail="Only pending withdrawals can be cancelled")
        
    withdrawal.status = WithdrawalStatus.CANCELLED
    
    usd_rate = 50000.0 if withdrawal.asset_symbol == "BTC" else 1.0
    usd_value = withdrawal.amount * usd_rate
    current_user.trading_balance += usd_value
    current_user.account_balance += usd_value
    
    await db.commit()
    return {"message": "Withdrawal cancelled and balance refunded"}


@router.get("/confirm")
@limiter.limit("5/minute")
async def confirm_withdrawal(
    request: Request,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Confirm a pending withdrawal using an email confirmation token."""
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")

    stmt = select(Withdrawal).where(
        Withdrawal.confirmation_token == token
    ).with_for_update()
    
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
