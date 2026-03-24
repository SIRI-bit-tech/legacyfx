from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import logging

from app.database import get_db
from app.models.user import User
from app.models.admin import Admin
from app.models.asset import Asset
from app.models.finance import Deposit, Withdrawal, DepositStatus, WithdrawalStatus, Transaction, TransactionType
from app.models.deposit_addresses import DepositAddress
from app.models.mining import MiningPlan, MiningSubscription, MiningStatus
from app.models.settings import SystemSettings
from app.models.trading import ExecutionTrade
from app.utils.admin_auth import get_current_admin
from app.utils.market import get_live_price
from app.schemas.admin import AdminRegisterRequest, AdminLoginRequest, AdminAuthResponse
from app.services.admin_auth_service import register_admin_account, login_admin_account
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

logger = logging.getLogger(__name__)

@router.post("/auth/register")
async def register_admin(request: AdminRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Strongly verified admin registration using a secret environment code."""
    return await register_admin_account(
        db=db,
        name=request.name,
        email=request.email,
        password=request.password,
        admin_code=request.admin_code
    )


@router.post("/auth/login", response_model=AdminAuthResponse)
async def login_admin(request: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    """Admin login using a dedicated admin account."""
    return await login_admin_account(
        db=db,
        email=request.email,
        password=request.password
    )

# Helper dependency to check if user is admin
async def require_admin(current_admin: Admin = Depends(get_current_admin)) -> Admin:
    return current_admin

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
        Deposit.fiat_amount.isnot(None),  # Explicitly handle NULL fiat_amount
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


class DepositAddressCreateRequest(BaseModel):
    asset: str
    network: str
    address: str
    qrCodeUrl: str
    minDeposit: float = 0.0
    fee: float = 0.0


class DepositAddressUpdateRequest(BaseModel):
    asset: Optional[str] = None
    network: Optional[str] = None
    address: Optional[str] = None
    qrCodeUrl: Optional[str] = None
    minDeposit: Optional[float] = None
    fee: Optional[float] = None
    is_active: Optional[bool] = None


@router.post("/deposit-addresses")
async def create_deposit_address(
    request: DepositAddressCreateRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    """Create a new admin-configured deposit address."""
    new_id = str(uuid.uuid4())
    deposit_address = DepositAddress(
        id=new_id,
        asset=request.asset.upper().strip(),
        network=request.network.upper().strip(),
        address=request.address.strip(),
        qr_code_url=request.qrCodeUrl.strip(),
        min_deposit=float(request.minDeposit or 0.0),
        fee=float(request.fee or 0.0),
        is_active=True,
    )

    db.add(deposit_address)
    await db.commit()

    return {
        "id": deposit_address.id,
        "asset": deposit_address.asset,
        "network": deposit_address.network,
        "address": deposit_address.address,
        "qrCodeUrl": deposit_address.qr_code_url,
        "minDeposit": deposit_address.min_deposit,
        "fee": deposit_address.fee,
        "is_active": deposit_address.is_active,
    }


@router.put("/deposit-addresses/{deposit_address_id}")
async def update_deposit_address(
    deposit_address_id: str,
    request: DepositAddressUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    """Update an admin-configured deposit address."""
    stmt = select(DepositAddress).where(DepositAddress.id == deposit_address_id)
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()

    if not row:
        raise HTTPException(status_code=404, detail="Deposit address not found")

    if request.asset is not None:
        row.asset = request.asset.upper().strip()
    if request.network is not None:
        row.network = request.network.upper().strip()
    if request.address is not None:
        row.address = request.address.strip()
    if request.qrCodeUrl is not None:
        row.qr_code_url = request.qrCodeUrl.strip()
    if request.minDeposit is not None:
        row.min_deposit = float(request.minDeposit)
    if request.fee is not None:
        row.fee = float(request.fee)
    if request.is_active is not None:
        row.is_active = bool(request.is_active)

    await db.commit()

    return {
        "id": row.id,
        "asset": row.asset,
        "network": row.network,
        "address": row.address,
        "qrCodeUrl": row.qr_code_url,
        "minDeposit": row.min_deposit,
        "fee": row.fee,
        "is_active": row.is_active,
    }


@router.get("/deposit-addresses")
async def list_deposit_addresses(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    """List all configured deposit addresses."""
    stmt = select(DepositAddress).order_by(DepositAddress.created_at.desc())
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return [
        {
            "id": r.id,
            "asset": r.asset,
            "network": r.network,
            "address": r.address,
            "qrCodeUrl": r.qr_code_url,
            "minDeposit": r.min_deposit,
            "fee": r.fee,
            "is_active": r.is_active,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        for r in rows
    ]


@router.get("/deposits", response_model=List[dict])
async def list_all_deposits(db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    """List all user deposits for admin review."""
    stmt = select(Deposit, User.email).join(User, Deposit.user_id == User.id).order_by(Deposit.created_at.desc())
    result = await db.execute(stmt)
    rows = result.all()
    return [
        {
            "id": d.id,
            "user_id": d.user_id,
            "user_email": email,
            "asset_symbol": d.asset_symbol,
            "amount": d.amount,
            "fiat_amount": d.fiat_amount,
            "status": d.status,
            "blockchain_network": d.blockchain_network,
            "transaction_hash": d.transaction_hash,
            "created_at": d.created_at
        } for d, email in rows
    ]


@router.get("/withdrawals", response_model=List[dict])
async def list_all_withdrawals(db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    """List all user withdrawals for admin review."""
    stmt = select(Withdrawal, User.email).join(User, Withdrawal.user_id == User.id).order_by(Withdrawal.created_at.desc())
    result = await db.execute(stmt)
    rows = result.all()
    return [
        {
            "id": w.id,
            "user_id": w.user_id,
            "user_email": email,
            "asset_symbol": w.asset_symbol,
            "amount": w.amount,
            "fee": w.fee,
            "net_amount": w.net_amount,
            "destination_address": w.destination_address,
            "blockchain_network": w.blockchain_network,
            "status": w.status,
            "created_at": w.created_at
        } for w, email in rows
    ]


@router.get("/transactions", response_model=List[dict])
async def list_all_transactions(db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    """List all platform transactions for audit."""
    stmt = select(Transaction, User.email).join(User, Transaction.user_id == User.id).order_by(Transaction.created_at.desc())
    result = await db.execute(stmt)
    rows = result.all()
    return [
        {
            "id": t.id,
            "user_email": email,
            "type": t.type,
            "asset_symbol": t.asset_symbol,
            "amount": t.amount,
            "usd_amount": t.usd_amount,
            "status": t.status,
            "created_at": t.created_at,
            "reference_id": t.reference_id
        } for t, email in rows
    ]


@router.get("/orders", response_model=List[dict])
async def list_all_orders(db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    """List all execution trades (orders) for monitoring."""
    stmt = select(ExecutionTrade, User.email).join(User, ExecutionTrade.user_id == User.id).order_by(ExecutionTrade.created_at.desc())
    result = await db.execute(stmt)
    rows = result.all()
    return [
        {
            "id": t.id,
            "user_email": email,
            "symbol": t.symbol,
            "side": t.side,
            "quantity": t.quantity,
            "price": t.price,
            "created_at": t.created_at
        } for t, email in rows
    ]


@router.get("/assets", response_model=List[dict])
async def list_assets(db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    """List all configured assets."""
    stmt = select(Asset).order_by(Asset.symbol)
    result = await db.execute(stmt)
    assets = result.scalars().all()
    return [
        {
            "id": a.id,
            "symbol": a.symbol,
            "name": a.name,
            "price": a.current_price,
            "change24h": a.price_change_percentage_24h,
            "is_enabled": a.is_active
        } for a in assets
    ]


@router.patch("/assets/{asset_id}/toggle")
async def toggle_asset(asset_id: str, is_enabled: bool, db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    """Toggle asset active status."""
    stmt = update(Asset).where(Asset.id == asset_id).values(is_active=is_enabled)
    await db.execute(stmt)
    await db.commit()
    return {"message": f"Asset {'enabled' if is_enabled else 'disabled'}"}


class AssetCreateRequest(BaseModel):
    symbol: str
    name: str

@router.post("/assets")
async def create_asset(request: AssetCreateRequest, db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    """Add a new tradable asset."""
    asset = Asset(
        id=str(uuid.uuid4()),
        symbol=request.symbol.upper(),
        name=request.name,
        is_active=True
    )
    db.add(asset)
    await db.commit()
    return {"message": "Asset added successfully"}


@router.get("/settings")
async def get_all_settings(db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    """Retrieve all system settings."""
    stmt = select(SystemSettings)
    result = await db.execute(stmt)
    settings = result.scalars().all()
    return {s.key: s.value for s in settings}


@router.patch("/settings")
async def update_settings(settings_dict: dict, db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    """Batch update system settings."""
    for key, value in settings_dict.items():
        stmt = update(SystemSettings).where(SystemSettings.key == key).values(value=str(value))
        await db.execute(stmt)
    await db.commit()
    return {"message": "Settings updated successfully"}
