from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.finance import Deposit, DepositStatus, Transaction, TransactionType
from app.utils.auth import get_current_user
from app.utils.market import get_live_price
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/deposits", tags=["deposits"])

class DepositRequest(BaseModel):
    asset_symbol: str
    amount: float
    blockchain_network: Optional[str] = "ERC20"

class DepositResponse(BaseModel):
    id: str
    asset_symbol: str
    amount: float
    wallet_address: str
    blockchain_network: str
    status: str
    created_at: datetime

@router.post("/request", response_model=DepositResponse)
async def request_deposit(
    request: DepositRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a deposit address for the user."""
    # In a real app, this would call a wallet service (like BitGo, Fireblocks)
    # For this broker, we provide a static address per user or dynamic
    mock_addresses = {
        "BTC": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "ETH": "0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae",
        "USDT": "0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae"
    }
    
    address = mock_addresses.get(request.asset_symbol.upper(), "0xADDRESS_NOT_FOUND")
    
    deposit_id = str(uuid.uuid4())
    new_deposit = Deposit(
        id=deposit_id,
        user_id=current_user.id,
        asset_symbol=request.asset_symbol.upper(),
        amount=request.amount,
        wallet_address=address,
        blockchain_network=request.blockchain_network,
        status=DepositStatus.PENDING
    )
    
    db.add(new_deposit)
    await db.commit()
    
    return DepositResponse(
        id=deposit_id,
        asset_symbol=request.asset_symbol.upper(),
        amount=request.amount,
        wallet_address=address,
        blockchain_network=request.blockchain_network or "ERC20",
        status="PENDING",
        created_at=datetime.utcnow()
    )

@router.get("/history", response_model=List[DepositResponse])
async def get_deposit_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's deposit history."""
    stmt = select(Deposit).where(Deposit.user_id == current_user.id).order_by(Deposit.created_at.desc())
    result = await db.execute(stmt)
    deposits = result.scalars().all()
    
    return [
        DepositResponse(
            id=d.id,
            asset_symbol=d.asset_symbol,
            amount=d.amount,
            wallet_address=d.wallet_address or "",
            blockchain_network=d.blockchain_network or "",
            status=d.status.value,
            created_at=d.created_at
        ) for d in deposits
    ]

@router.post("/{deposit_id}/confirm")
async def confirm_deposit(
    deposit_id: str,
    transaction_hash: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """User submits transaction hash to confirm deposit (manual verification fallback)."""
    stmt = select(Deposit).where(Deposit.id == deposit_id, Deposit.user_id == current_user.id)
    result = await db.execute(stmt)
    deposit = result.scalar_one_or_none()
    
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit request not found")
        
    deposit.transaction_hash = transaction_hash
    # In a real app, a background task would monitor the blockchain
    # Here, we'll auto-confirm for the demo if it's pending
    if deposit.status == DepositStatus.PENDING:
        deposit.status = DepositStatus.CONFIRMED
        deposit.confirmed_at = datetime.utcnow()
        
        # Update user balance (fetch actual rate)
        live_price = await get_live_price(deposit.asset_symbol)
        usd_value = deposit.amount * live_price
        current_user.account_balance += usd_value
        current_user.trading_balance += usd_value # Move to trading balance automatically
        
        # Record Transaction
        txn = Transaction(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            type=TransactionType.DEPOSIT,
            asset_symbol=deposit.asset_symbol,
            amount=deposit.amount,
            usd_amount=usd_value,
            description=f"Deposit {deposit.asset_symbol}",
            reference_id=deposit.id
        )
        db.add(txn)
        
    await db.commit()
    return {"message": "Deposit confirmation submitted", "status": deposit.status.value}
