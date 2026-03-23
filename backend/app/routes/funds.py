from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.deposit_addresses import DepositAddress
from app.models.trading import UserAsset, Order, OrderStatus
from app.services.price_broadcast import price_broadcast_service
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/v1/funds", tags=["funds"])

DEPOSIT_NOT_AVAILABLE_MESSAGE = "Deposit address for this network is not available yet. Please contact support."


@router.get("/deposit-address")
async def get_deposit_address(
    userId: str,
    asset: str,
    network: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get admin-configured deposit address for a given asset+network."""
    if userId != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    asset_norm = (asset or '').upper().strip()
    network_norm = (network or '').strip()

    stmt = select(DepositAddress).where(
        DepositAddress.asset == asset_norm,
        DepositAddress.network == network_norm,
        DepositAddress.is_active.is_(True),
    )
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()

    if not row:
        raise HTTPException(status_code=404, detail=DEPOSIT_NOT_AVAILABLE_MESSAGE)

    return {
        "address": row.address,
        "qrCodeUrl": row.qr_code_url,
        "minDeposit": row.min_deposit,
        "fee": row.fee,
        "network": row.network,
    }


@router.get("/summary")
async def get_funds_summary(
    userId: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get portfolio summary used by Assets and Dashboard cards."""
    if userId != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    assets_stmt = select(UserAsset).where(UserAsset.user_id == userId)
    assets_result = await db.execute(assets_stmt)
    assets = assets_result.scalars().all()

    available_assets_value = sum(float(a.available_balance or 0) for a in assets)
    in_orders_assets_value = sum(float((a.total_balance or 0) - (a.available_balance or 0)) for a in assets)
    available = float(current_user.trading_balance or 0) + available_assets_value
    in_orders = in_orders_assets_value
    net_worth = available + in_orders

    open_orders_stmt = select(Order).where(
        Order.user_id == userId,
        Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
    )
    open_orders_result = await db.execute(open_orders_stmt)
    open_orders_count = len(open_orders_result.scalars().all())

    return {
        "netWorth": net_worth,
        "available": available,
        "inOrders": in_orders,
        "unrealisedPnl": 0.0,
        "pnlPercent": 0.0,
        "change24h": 0.0,
        "openOrdersCount": open_orders_count,
    }


@router.get("/assets")
async def get_funds_assets(
    userId: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get per-asset balances for Assets table and Trade Funds tab."""
    if userId != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    stmt = select(UserAsset).where(UserAsset.user_id == userId)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    assets = [
        {
            "symbol": r.asset_symbol,
            "name": r.asset_symbol,
            "total": float(r.total_balance or 0),
            "available": float(r.available_balance or 0),
            "inOrders": float((r.total_balance or 0) - (r.available_balance or 0)),
        }
        for r in rows
    ]

    usd_balance = float(current_user.trading_balance or 0)
    if usd_balance > 0 or len(assets) == 0:
        assets.insert(
            0,
            {
                "symbol": "USD",
                "name": "US Dollar",
                "total": usd_balance,
                "available": usd_balance,
                "inOrders": 0.0,
            },
        )

    return {"assets": assets}


@router.post("/prices/subscribe")
async def subscribe_prices(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    """Subscribe/unsubscribe symbols for live price broadcast service."""
    user_id = str(body.get("userId") or "").strip()
    symbols = body.get("symbols") or []
    action = str(body.get("action") or "subscribe").strip().lower()

    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not isinstance(symbols, list):
        raise HTTPException(status_code=400, detail="symbols must be an array")

    normalized = [str(s).replace("-", "").replace("/", "").upper().strip() for s in symbols if str(s).strip()]

    for sym in normalized:
        if action == "unsubscribe":
            price_broadcast_service.remove_symbol(sym)
        else:
            price_broadcast_service.add_symbol(sym)

    return {"success": True, "symbols": normalized, "action": action}

