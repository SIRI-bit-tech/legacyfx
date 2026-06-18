from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, func
from typing import List, Optional
import uuid
from datetime import datetime

from app.database import get_db, get_read_db
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

    # 1.5 Check for weekend market closure for non-crypto assets
    crypto_bases = {"BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "TRX", "TON", "DOT", "LINK", "LTC", "BCH", "MATIC", "SHIB"}
    crypto_quotes = {"USDT", "USDC"}
    
    is_crypto = pair.quote_asset in crypto_quotes or pair.base_asset in crypto_bases
    
    if not is_crypto:
        current_day = datetime.utcnow().weekday()
        if current_day in [5, 6]: # 5 is Saturday, 6 is Sunday
            raise HTTPException(status_code=400, detail="Market Closed: Forex and Stock trading is not available on weekends.")

    # 2. Check Balances & Lock Assets
    # For BUY: check USD (quote_asset) balance
    # For SELL: check base_asset balance
    
    # Actually checking UserAsset for simplicity in this implementation
    asset_symbol = pair.quote_asset if request.trade_type == "BUY" else pair.base_asset
    
    # Fetch live price
    base_symbol = pair.base_asset
    current_market_price = await get_live_price(base_symbol)
    
    # Determine execution price and status
    execution_price = current_market_price
    order_status = OrderStatus.FILLED
    
    if request.order_type == "LIMIT":
        if not request.price:
            raise HTTPException(status_code=400, detail="Limit orders require a target price")
        execution_price = request.price
        order_status = OrderStatus.PENDING

    cost_estimate = request.quantity * execution_price
    
    # Validate TP/SL relative to entry price
    ref_price = execution_price  # the price the trade will execute at
    if request.trade_type == "BUY":
        if request.take_profit is not None and request.take_profit <= ref_price:
            raise HTTPException(
                status_code=400,
                detail=f"Take Profit (${request.take_profit:,.2f}) must be ABOVE the entry price (${ref_price:,.2f}) for a BUY trade"
            )
        if request.stop_loss is not None and request.stop_loss >= ref_price:
            raise HTTPException(
                status_code=400,
                detail=f"Stop Loss (${request.stop_loss:,.2f}) must be BELOW the entry price (${ref_price:,.2f}) for a BUY trade"
            )
    else:  # SELL
        if request.take_profit is not None and request.take_profit >= ref_price:
            raise HTTPException(
                status_code=400,
                detail=f"Take Profit (${request.take_profit:,.2f}) must be BELOW the entry price (${ref_price:,.2f}) for a SELL trade"
            )
        if request.stop_loss is not None and request.stop_loss <= ref_price:
            raise HTTPException(
                status_code=400,
                detail=f"Stop Loss (${request.stop_loss:,.2f}) must be ABOVE the entry price (${ref_price:,.2f}) for a SELL trade"
            )
    
    # Calculate leverage and margin
    leverage = request.leverage or current_user.default_leverage or 100
    margin_required = cost_estimate / leverage

    # Calculate free margin
    from app.models.trading import Position, PositionStatus
    
    open_positions_stmt = select(Position).where(Position.user_id == current_user.id, Position.status == PositionStatus.OPEN)
    open_positions_result = await db.execute(open_positions_stmt)
    open_positions = open_positions_result.scalars().all()
    
    unrealized_pnl = 0.0
    used_margin = 0.0
    for pos in open_positions:
        # We can optimize this later, but for now we fetch live price per position
        pos_price = await get_live_price(pos.symbol)
        if pos.side == OrderSide.BUY:
            pnl = (pos_price - pos.entry_price) * pos.quantity
        else:
            pnl = (pos.entry_price - pos_price) * pos.quantity
        unrealized_pnl += pnl
        used_margin += pos.margin

    free_margin = current_user.trading_balance + unrealized_pnl - used_margin

    if margin_required > free_margin:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient free margin. Required: ${margin_required:,.2f}, Available: ${max(0, free_margin):,.2f}"
        )

    # 3. Create Order
    order_id = str(uuid.uuid4())
    
    new_order = Order(
        id=order_id,
        user_id=current_user.id,
        symbol=request.symbol,
        type=OrderType[request.order_type] if request.order_type in ["MARKET", "LIMIT"] else OrderType.MARKET,
        side=OrderSide.BUY if request.trade_type == "BUY" else OrderSide.SELL,
        status=order_status,
        quantity=request.quantity,
        price=request.price,
        take_profit=request.take_profit,
        stop_price=request.stop_loss,
        executed_quantity=request.quantity if order_status == OrderStatus.FILLED else 0.0,
        average_price=current_market_price if order_status == OrderStatus.FILLED else None
    )
    
    # 4. Create Position (if MARKET)
    if order_status == OrderStatus.FILLED:
        new_position = Position(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            symbol=request.symbol,
            side=OrderSide.BUY if request.trade_type == "BUY" else OrderSide.SELL,
            quantity=request.quantity,
            entry_price=execution_price,
            leverage=leverage,
            margin=margin_required,
            take_profit=request.take_profit,
            stop_loss=request.stop_loss,
            status=PositionStatus.OPEN
        )
        db.add(new_position)

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
    
    # TP/SL are now handled directly by the Position model in the background, 
    # so we no longer spawn separate dummy Order entries for them.

    await db.commit()
    
    # Process referral commission on trading fee
    try:
        from app.services.referral_service import ReferralService
        from app.utils.ably import get_ably_client
        from app.config import get_settings
        
        settings = get_settings()
        ably_client = get_ably_client()
        
        # Calculate trading fee (0.1% default)
        trading_fee = cost_estimate * settings.TRADING_FEE_PERCENTAGE
        
        await ReferralService.process_trade_commission(
            referred_user_id=current_user.id,
            trade_fee=trading_fee,
            db=db,
            ably_client=ably_client
        )
    except Exception as e:
        # Log but don't fail trade if referral processing fails
        import logging
        logging.error(f"Failed to process referral commission: {e}")
    
    # 6. Publish order update to Ably
    await publish_order_update(current_user.id, {
        "id": order_id,
        "symbol": request.symbol,
        "type": new_order.type.value,
        "side": new_order.side.value,
        "price": current_market_price,
        "quantity": request.quantity,
        "filled": request.quantity,
        "status": new_order.status.value,
        "created_at": new_order.created_at.isoformat()
    })
    
    # 7. Publish balance update to Ably
    await publish_balance_update(current_user.id)
    
    # 8. Publish notification
    await publish_notification(
        user_id=current_user.id,
        type="TRADE",
        title="Trade Executed",
        message=f"Your {request.trade_type} order for {request.quantity} {request.symbol} has been executed.",
        db=db
    )
    
    return TradeResponse(
        id=order_id,
        symbol=request.symbol,
        trade_type=request.trade_type,
        quantity=request.quantity,
        entry_price=current_market_price,
        status="FILLED",
        created_at=datetime.utcnow()
    )


async def publish_order_update(user_id: str, order_data: dict):
    """Publish order update to Ably channel."""
    try:
        from app.config import get_settings
        from ably import AblyRest
        
        settings = get_settings()
        api_key = settings.ABLY_API_KEY or settings.ABLY_KEY
        
        if api_key:
            ably_client = AblyRest(api_key)
            channel = ably_client.channels.get(f"orders:{user_id}")
            await channel.publish("update", order_data)
    except Exception as e:
        logger.error(f"Error publishing order update: {e}")


async def publish_balance_update(user_id: str):
    """Publish balance update to Ably channel."""
    try:
        from app.config import get_settings
        from ably import AblyRest
        
        settings = get_settings()
        api_key = settings.ABLY_API_KEY or settings.ABLY_KEY
        
        if api_key:
            ably_client = AblyRest(api_key)
            channel = ably_client.channels.get(f"funds:{user_id}")
            await channel.publish("update", {"timestamp": datetime.utcnow().isoformat()})
    except Exception as e:
        logger.error(f"Error publishing balance update: {e}")

@router.get("/portfolio", response_model=PortfolioResponse)
async def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db)
):
    """Get user's current holdings and performance."""
    from app.models.trading import Position, PositionStatus
    
    stmt = select(Position).where(Position.user_id == current_user.id, Position.status == PositionStatus.OPEN)
    result = await db.execute(stmt)
    open_positions = result.scalars().all()
    
    holdings = []
    total_unrealized_pnl = 0.0
    used_margin = 0.0
    
    for pos in open_positions:
        current_price = await get_live_price(pos.symbol)
        if pos.side == OrderSide.BUY:
            pnl = (current_price - pos.entry_price) * pos.quantity
        else:
            pnl = (pos.entry_price - current_price) * pos.quantity
            
        value = pos.margin + pnl
        total_unrealized_pnl += pnl
        used_margin += pos.margin
        
        pnl_percentage = (pnl / pos.margin * 100) if pos.margin > 0 else 0
        
        holdings.append(PortfolioHolding(
            symbol=pos.symbol,
            quantity=pos.quantity,
            entry_price=pos.entry_price,
            current_price=current_price,
            value=value,
            pnl=pnl,
            pnl_percentage=pnl_percentage
        ))
        
    equity = current_user.trading_balance + total_unrealized_pnl
    total_pnl_percentage = (total_unrealized_pnl / current_user.trading_balance * 100) if current_user.trading_balance > 0 else 0
    
    return PortfolioResponse(
        total_value=equity,
        total_pnl=total_unrealized_pnl,
        total_pnl_percentage=total_pnl_percentage,
        holdings=holdings
    )

@router.get("/history", response_model=List[TradeResponse])
async def get_trade_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db)
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


@router.get("/positions")
async def get_active_positions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db)
):
    """Get user's active positions — filled MARKET orders with their linked TP/SL."""
    from app.models.trading import Position, PositionStatus
    
    stmt = select(Position).where(
        Position.user_id == current_user.id,
        Position.status == PositionStatus.OPEN
    ).order_by(Position.created_at.desc())
    
    result = await db.execute(stmt)
    open_positions = result.scalars().all()
    
    positions = []
    for pos in open_positions:
        positions.append({
            "id": pos.id,
            "symbol": pos.symbol,
            "side": pos.side.value,
            "entry_price": float(pos.entry_price),
            "quantity": float(pos.quantity),
            "take_profit": float(pos.take_profit) if pos.take_profit else None,
            "stop_loss": float(pos.stop_loss) if pos.stop_loss else None,
            "is_open": True,
            "created_at": pos.created_at.isoformat(),
        })
    
    return positions


@router.get("/orders/open")
async def get_open_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db)
):
    """Get user's open orders (pending, open, partially filled)."""
    stmt = select(Order).where(
        Order.user_id == current_user.id,
        Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED, OrderStatus.PENDING]),
        Order.type.not_in([OrderType.TAKE_PROFIT, OrderType.STOP_LOSS])
    ).order_by(Order.created_at.desc())
    
    result = await db.execute(stmt)
    orders = result.scalars().all()
    
    return [
        {
            "id": o.id,
            "symbol": o.symbol,
            "type": o.type.value,
            "side": o.side.value,
            "price": float(o.average_price or o.price or o.stop_price or 0),
            "quantity": float(o.quantity),
            "filled": float(o.executed_quantity or 0),
            "status": o.status.value,
            "created_at": o.created_at.isoformat()
        } for o in orders
    ]


@router.get("/orders/history")
async def get_order_history(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db)
):
    """Get user's order history with pagination and filters."""
    # Build query
    query = select(Order).where(
        Order.user_id == current_user.id,
        Order.type.not_in([OrderType.TAKE_PROFIT, OrderType.STOP_LOSS])
    )
    
    # Apply status filter
    if status and status.upper() in ['FILLED', 'CANCELLED']:
        query = query.where(Order.status == OrderStatus[status.upper()])
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    # Apply pagination
    query = query.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return {
        "orders": [
            {
                "id": o.id,
                "symbol": o.symbol,
                "type": o.type.value,
                "side": o.side.value,
                "price": float(o.average_price or o.price or o.stop_price or 0),
                "quantity": float(o.quantity),
                "status": o.status.value,
                "created_at": o.created_at.isoformat()
            } for o in orders
        ],
        "page": page,
        "total_pages": total_pages,
        "total": total
    }


@router.get("/trades/history")
async def get_trade_history(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db)
):
    """Get user's executed trades history with pagination."""
    # Query for filled orders only
    query = select(Order).where(
        Order.user_id == current_user.id,
        Order.status == OrderStatus.FILLED,
        Order.type.not_in([OrderType.TAKE_PROFIT, OrderType.STOP_LOSS])
    )
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    # Apply pagination
    query = query.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return {
        "trades": [
            {
                "id": o.id,
                "symbol": o.symbol,
                "side": o.side.value,
                "price": float(o.average_price or 0),
                "quantity": float(o.quantity),
                "total": float(o.quantity * (o.average_price or 0)),
                "fee": 0.0,  # TODO: Calculate actual fee
                "created_at": o.created_at.isoformat()
            } for o in orders
        ],
        "page": page,
        "total_pages": total_pages,
        "total": total
    }


@router.delete("/orders/{order_id}")
async def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel an open order."""
    # Find the order
    stmt = select(Order).where(
        Order.id == order_id,
        Order.user_id == current_user.id
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status not in [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]:
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")
    
    # Update order status
    order.status = OrderStatus.CANCELLED
    await db.commit()
    
    # Publish order update to Ably
    await publish_order_update(current_user.id, {
        "id": order.id,
        "symbol": order.symbol,
        "type": order.type.value,
        "side": order.side.value,
        "price": float(order.average_price or 0),
        "quantity": float(order.quantity),
        "filled": float(order.executed_quantity or 0),
        "status": order.status.value,
        "created_at": order.created_at.isoformat()
    })
    
    return {"status": "success", "message": "Order cancelled"}


@router.get("/funds")
async def get_funds(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db)
):
    """Get user's asset balances."""
    # Get all user assets
    stmt = select(UserAsset).where(UserAsset.user_id == current_user.id)
    result = await db.execute(stmt)
    assets = result.scalars().all()
    
    balances = []
    
    # Add crypto assets
    for asset in assets:
        balances.append({
            "asset": asset.asset_symbol,
            "total_balance": float(asset.total_balance),
            "available": float(asset.available_balance),
            "in_order": float(asset.total_balance - asset.available_balance)
        })
    
    # Add USD balance (from trading_balance)
    if current_user.trading_balance > 0 or len(balances) == 0:
        balances.insert(0, {
            "asset": "USD",
            "total_balance": float(current_user.trading_balance),
            "available": float(current_user.trading_balance),
            "in_order": 0.0
        })
    
    # Sort by total balance descending
    balances.sort(key=lambda x: x["total_balance"], reverse=True)
    
    return balances

@router.post("/positions/{position_id}/close")
async def close_position(
    position_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Close an open position."""
    from app.models.trading import Position, PositionStatus
    
    # 1. Find the position
    stmt = select(Position).where(
        Position.id == position_id,
        Position.user_id == current_user.id,
        Position.status == PositionStatus.OPEN
    )
    result = await db.execute(stmt)
    position = result.scalar_one_or_none()
    
    if not position:
        raise HTTPException(status_code=404, detail="Active position not found")
        
    # 2. Get current live price
    current_price = await get_live_price(position.symbol)
    
    # 3. Calculate PNL
    if position.side == OrderSide.BUY:
        pnl = (current_price - position.entry_price) * position.quantity
    else:
        pnl = (position.entry_price - current_price) * position.quantity
        
    # 4. Update Position
    position.status = PositionStatus.CLOSED
    position.closed_at = datetime.utcnow()
    position.realized_pnl = pnl
    
    # 5. Update user trading balance (realized PNL)
    current_user.trading_balance += pnl
    
    # 6. Record transaction
    txn = Transaction(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        type=TransactionType.TRADE,
        asset_symbol="USD",
        amount=pnl,
        usd_amount=pnl,
        description=f"Closed {position.side.value} position {position.symbol}",
        reference_id=position.id
    )
    db.add(txn)
    
    await db.commit()
    
    # 7. Publish balance update to Ably
    await publish_balance_update(current_user.id)
    
    # 8. Publish notification
    await publish_notification(
        user_id=current_user.id,
        type="TRADE",
        title="Position Closed",
        message=f"Your {position.side.value} position for {position.symbol} was closed with ${pnl:,.2f} PNL.",
        db=db
    )
    return {
        "status": "success",
        "message": f"Position closed with {pnl:,.2f} PNL",
        "position_id": position.id,
        "pnl": pnl
    }

async def publish_notification(user_id: str, type: str, title: str, message: str, db: AsyncSession):
    import uuid
    from app.models.notification import Notification
    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        is_read=False
    )
    db.add(notification)
    await db.commit()
    
    try:
        from app.config import get_settings
        from ably import AblyRest
        
        settings = get_settings()
        api_key = settings.ABLY_API_KEY or settings.ABLY_KEY
        
        if api_key:
            ably_client = AblyRest(api_key)
            channel = ably_client.channels.get(f"notifications:{user_id}")
            await channel.publish("new_notification", {
                "id": notification.id,
                "type": notification.type,
                "title": notification.title,
                "message": notification.message,
                "is_read": notification.is_read,
                "link": None,
                "created_at": datetime.utcnow().isoformat()
            })
    except Exception as e:
        logger.error(f"Error publishing notification: {e}")
