from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid
from datetime import datetime
from fastapi import BackgroundTasks
from app.utils.email import send_email, create_email_template
from app.models.notification import Notification

from app.database import get_db
from app.models.user import User
from app.models.finance import Deposit, DepositStatus, Transaction, TransactionType
from app.utils.auth import get_current_user
from app.utils.market import get_live_price
from app.models.deposit_addresses import DepositAddress
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/deposits", tags=["deposits"])

class DepositRequest(BaseModel):
    asset_symbol: str
    amount: float
    fiat_amount: Optional[float] = None
    blockchain_network: Optional[str] = "ERC20"

class DepositConfirmRequest(BaseModel):
    transaction_hash: Optional[str] = None
    proof_url: Optional[str] = None

class DepositResponse(BaseModel):
    id: str
    asset_symbol: str
    amount: float
    wallet_address: str
    blockchain_network: str
    status: str
    proof_url: Optional[str] = None
    created_at: datetime

@router.post("/request", response_model=DepositResponse)
async def request_deposit(
    request: DepositRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a deposit address for the user."""

    asset_norm = request.asset_symbol.upper().strip()
    # Normalize network: handle empty/whitespace and convert to uppercase for consistency
    raw_net = request.blockchain_network or 'ERC20'
    stripped_net = raw_net.strip().upper()
    network_norm = stripped_net if stripped_net else 'ERC20'

    stmt = select(DepositAddress).where(
        DepositAddress.asset == asset_norm,
        DepositAddress.network == network_norm,
        DepositAddress.is_active.is_(True),
    )
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Deposit address for this network is not available yet. Please contact support.",
        )

    address = row.address
    
    deposit_id = str(uuid.uuid4())
    new_deposit = Deposit(
        id=deposit_id,
        user_id=current_user.id,
        asset_symbol=asset_norm,
        amount=request.amount,
        fiat_amount=request.fiat_amount,
        wallet_address=address,
        blockchain_network=network_norm,
        status=DepositStatus.PENDING
    )
    
    db.add(new_deposit)
    await db.commit()
    
    return DepositResponse(
        id=deposit_id,
        asset_symbol=asset_norm,
        amount=request.amount,
        wallet_address=address,
        blockchain_network=network_norm,
        status="PENDING",
        proof_url=None,
        created_at=datetime.utcnow()
    )

@router.get("/address")
async def get_deposit_address(
    asset_symbol: str,
    blockchain_network: Optional[str] = "ERC20",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch a deposit address without creating a pending deposit record."""
    asset_norm = asset_symbol.upper().strip()
    raw_net = blockchain_network or 'ERC20'
    network_norm = raw_net.strip().upper() if raw_net.strip().upper() else 'ERC20'

    stmt = select(DepositAddress).where(
        DepositAddress.asset == asset_norm,
        DepositAddress.network == network_norm,
        DepositAddress.is_active.is_(True),
    )
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Deposit address for this network is not available yet. Please contact support.",
        )

    return {"wallet_address": row.address}

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
            proof_url=d.proof_url,
            created_at=d.created_at
        ) for d in deposits
    ]

@router.post("/{deposit_id}/confirm")
async def confirm_deposit(
    deposit_id: str,
    request: DepositConfirmRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """User submits transaction hash or proof to confirm deposit."""
    stmt = select(Deposit).where(Deposit.id == deposit_id, Deposit.user_id == current_user.id)
    result = await db.execute(stmt)
    deposit = result.scalar_one_or_none()
    
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit request not found")
        
    if request.transaction_hash:
        deposit.transaction_hash = request.transaction_hash
    if request.proof_url:
        deposit.proof_url = request.proof_url
    if deposit.status == DepositStatus.PENDING:
        # Create a pending transaction record so it shows up in history immediately
        txn = Transaction(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            type=TransactionType.DEPOSIT,
            asset_symbol=deposit.asset_symbol,
            amount=deposit.amount,
            description=f"Deposit {deposit.asset_symbol}",
            reference_id=deposit.id,
            status="PENDING"
        )
        db.add(txn)
        
        # Create a notification for the user
        notification_id = str(uuid.uuid4())
        notification = Notification(
            id=notification_id,
            user_id=current_user.id,
            type="DEPOSIT",
            title="Deposit Awaiting Verification",
            message=f"Your deposit of {deposit.amount} {deposit.asset_symbol} has been sent and is awaiting transaction verification.",
            is_read=False
        )
        db.add(notification)
        
        # Send email to the user
        email_content = create_email_template(
            title="Deposit Awaiting Verification",
            message=f"We have received your transaction hash or proof for your deposit of {deposit.amount} {deposit.asset_symbol}. Your balance will be updated immediately after your payment is received and approved.",
            code=None
        )
        background_tasks.add_task(
            send_email,
            current_user.email,
            "Deposit Awaiting Verification - Prime Meridian Markets",
            email_content
        )
        
    await db.commit()
    return {"message": "Deposit confirmation submitted. Awaiting verification.", "status": deposit.status.value}
