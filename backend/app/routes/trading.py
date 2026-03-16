from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from typing import List, Optional
import uuid
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.trading import Order, OrderType, OrderSide, OrderStatus, UserAsset, TradingPair, ExecutionTrade
from app.models.finance import Transaction, TransactionType
from app.utils.auth import get_current_user
from app.schemas.trade import TradeCreateRequest, TradeResponse, PortfolioResponse, PortfolioHolding
from app.utils.market import get_live_price

router = APIRouter(prefix="/api/v1/trading", tags=["trading"])

@router.post("/orders", response_model=TradeResponse)
async def create_order(
    request: TradeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Place a new trade order."""
    # 1. Validate Trading Pair
    stmt = select(TradingPair).where(TradingPair.symbol == request.symbol, TradingPair.is_active == True)
    pair_result = await db.execute(stmt)
    pair = pair_result.scalar_one_or_none()
    if not pair:
        raise HTTPException(status_code=400, detail="Invalid or inactive trading pair")

    # 2. Check Balances & Lock Assets
    # For BUY: check USD (quote_asset) balance
    # For SELL: check base_asset balance
    
    # Actually checking UserAsset for simplicity in this implementation
    asset_symbol = pair.quote_asset if request.trade_type == "BUY" else pair.base_asset
    
    # Fetch live price
    base_symbol = pair.base_asset
    current_market_price = await get_live_price(base_symbol)
    
    cost_estimate = request.quantity * current_market_price if request.trade_type == "BUY" else request.quantity
    
    # Check if user has enough
    # For simplicity, we just check current_user.trading_balance for USD buys
    if request.trade_type == "BUY":
        if current_user.trading_balance < cost_estimate:
            raise HTTPException(status_code=400, detail="Insufficient trading balance")
    else:
        # Check UserAsset for base_asset
        stmt = select(UserAsset).where(UserAsset.user_id == current_user.id, UserAsset.asset_symbol == pair.base_asset)
        asset_result = await db.execute(stmt)
        user_asset = asset_result.scalar_one_or_none()
        if not user_asset or user_asset.available_balance < request.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient {pair.base_asset} balance")

    # 3. Create Order
    order_id = str(uuid.uuid4())
    new_order = Order(
        id=order_id,
        user_id=current_user.id,
        symbol=request.symbol,
        type=OrderType.MARKET, # Defaulting to market for now
        side=OrderSide.BUY if request.trade_type == "BUY" else OrderSide.SELL,
        status=OrderStatus.FILLED, # Instant execution for market order logic
        quantity=request.quantity,
        executed_quantity=request.quantity,
        average_price=current_market_price
    )
    
    # 4. Update Balances & Assets (Atomic-ish)
    if request.trade_type == "BUY":
        current_user.trading_balance -= cost_estimate
        # Update or create UserAsset for base_asset
        stmt = select(UserAsset).where(UserAsset.user_id == current_user.id, UserAsset.asset_symbol == pair.base_asset)
        asset_result = await db.execute(stmt)
        target_asset = asset_result.scalar_one_or_none()
        if not target_asset:
            target_asset = UserAsset(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                asset_symbol=pair.base_asset,
                total_balance=request.quantity,
                available_balance=request.quantity
            )
            db.add(target_asset)
        else:
            target_asset.total_balance += request.quantity
            target_asset.available_balance += request.quantity
    else:
        # SELL
        current_user.trading_balance += cost_estimate
        stmt = select(UserAsset).where(UserAsset.user_id == current_user.id, UserAsset.asset_symbol == pair.base_asset)
        asset_result = await db.execute(stmt)
        target_asset = asset_result.scalar_one_or_none()
        target_asset.total_balance -= request.quantity
        target_asset.available_balance -= request.quantity

    # 5. Record Transaction
    txn = Transaction(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        type=TransactionType.TRADE,
        asset_symbol=pair.base_asset,
        amount=request.quantity,
        usd_amount=cost_estimate if request.trade_type == "BUY" else -cost_estimate,
        description=f"{request.trade_type} {request.symbol}",
        reference_id=order_id
    )
    
    db.add(new_order)
    db.add(txn)
    await db.commit()
    
    return TradeResponse(
        id=order_id,
        symbol=request.symbol,
        trade_type=request.trade_type,
        quantity=request.quantity,
        entry_price=current_market_price,
        status="FILLED",
        created_at=datetime.utcnow()
    )

@router.get("/portfolio", response_model=PortfolioResponse)
async def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's current holdings and performance."""
    stmt = select(UserAsset).where(UserAsset.user_id == current_user.id, UserAsset.total_balance > 0)
    result = await db.execute(stmt)
    assets = result.scalars().all()
    
    holdings = []
    total_value = 0.0
    
    for asset in assets:
        # Fetch live price
        current_price = await get_live_price(asset.asset_symbol)
        value = asset.total_balance * current_price
        total_value += value
        
        holdings.append(PortfolioHolding(
            symbol=asset.asset_symbol,
            quantity=asset.total_balance,
            entry_price=asset.average_buy_price,
            current_price=current_price,
            value=value,
            pnl=0.0, # Calculate based on avg buy price
            pnl_percentage=0.0
        ))
    
    return PortfolioResponse(
        total_value=total_value + current_user.trading_balance,
        total_pnl=0.0,
        total_pnl_percentage=0.0,
        holdings=holdings
    )

@router.get("/history", response_model=List[TradeResponse])
async def get_trade_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's past trades."""
    stmt = select(Order).where(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    result = await db.execute(stmt)
    orders = result.scalars().all()
    
    return [
        TradeResponse(
            id=o.id,
            symbol=o.symbol,
            trade_type="BUY" if o.side == OrderSide.BUY else "SELL",
            quantity=o.quantity,
            entry_price=o.average_price or 0.0,
            status=o.status.value,
            created_at=o.created_at
        ) for o in orders
    ]
