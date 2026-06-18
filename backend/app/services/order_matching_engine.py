import asyncio
import logging
import uuid
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db, async_session
from app.models.trading import Order, OrderStatus, OrderType, OrderSide, UserAsset
from app.models.finance import Transaction, TransactionType
from app.models.user import User
from app.utils.market import get_live_price

logger = logging.getLogger(__name__)

class OrderMatchingEngine:
    def __init__(self):
        self.running = False
        self.task = None

    async def start(self):
        if self.running:
            return
        self.running = True
        self.task = asyncio.create_task(self._match_loop())
        logger.info("Order Matching Engine started")

    async def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Order Matching Engine stopped")

    async def _match_loop(self):
        while self.running:
            try:
                await self.process_pending_orders()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in Order Matching Engine: {e}")
            
            await asyncio.sleep(2)

    async def process_pending_orders(self):
        async with async_session() as db:
            stmt = select(Order).where(Order.status == OrderStatus.PENDING)
            result = await db.execute(stmt)
            pending_orders = result.scalars().all()
            
            if not pending_orders:
                return
                
            symbols = set(order.symbol for order in pending_orders)
            live_prices = {}
            for symbol in symbols:
                live_prices[symbol] = await get_live_price(symbol)
                
            for order in pending_orders:
                current_price = live_prices.get(order.symbol, 0)
                if current_price == 0:
                    continue
                    
                await self._evaluate_order(db, order, current_price)
            
            await db.commit()

    async def _evaluate_order(self, db: AsyncSession, order: Order, current_price: float):
        should_execute = False
        
        # 1. LIMIT Orders
        if order.type == OrderType.LIMIT and order.price:
            if order.side == OrderSide.BUY and current_price <= order.price:
                should_execute = True
            elif order.side == OrderSide.SELL and current_price >= order.price:
                should_execute = True
                
        # 2. TAKE_PROFIT Orders
        elif order.type == OrderType.TAKE_PROFIT and order.price:
            if order.side == OrderSide.SELL and current_price >= order.price:
                should_execute = True
            elif order.side == OrderSide.BUY and current_price <= order.price:
                should_execute = True
                
        # 3. STOP_LOSS Orders
        elif order.type == OrderType.STOP_LOSS and order.stop_price:
            if order.side == OrderSide.SELL and current_price <= order.stop_price:
                should_execute = True
            elif order.side == OrderSide.BUY and current_price >= order.stop_price:
                should_execute = True

        if should_execute:
            await self._execute_order(db, order, current_price)

    async def _execute_order(self, db: AsyncSession, order: Order, execution_price: float):
        # Fetch user
        stmt = select(User).where(User.id == order.user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return
            
        cost_estimate = order.quantity * execution_price
        
        # Extract base asset from symbol (e.g. BTCUSDT -> BTC)
        base_asset = order.symbol.replace("USDT", "").replace("USD", "").replace("USDC", "")
        
        if order.side == OrderSide.BUY:
            # Handle Buy Execution
            if order.type == OrderType.LIMIT:
                leverage = user.default_leverage or 100
                margin_required = cost_estimate / leverage
                user.trading_balance -= margin_required
                
            stmt = select(UserAsset).where(UserAsset.user_id == user.id, UserAsset.asset_symbol == base_asset)
            asset_result = await db.execute(stmt)
            target_asset = asset_result.scalar_one_or_none()
            
            if not target_asset:
                target_asset = UserAsset(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    asset_symbol=base_asset,
                    total_balance=order.quantity,
                    available_balance=order.quantity,
                    average_buy_price=execution_price
                )
                db.add(target_asset)
            else:
                total_cost = (target_asset.total_balance * target_asset.average_buy_price) + (order.quantity * execution_price)
                target_asset.total_balance += order.quantity
                target_asset.available_balance += order.quantity
                target_asset.average_buy_price = total_cost / target_asset.total_balance
                
        else:
            # Handle Sell Execution (TP / SL / LIMIT SELL)
            # IMPORTANT: Check if user actually has the asset to sell
            stmt = select(UserAsset).where(UserAsset.user_id == user.id, UserAsset.asset_symbol == base_asset)
            asset_result = await db.execute(stmt)
            target_asset = asset_result.scalar_one_or_none()
            
            if not target_asset or target_asset.available_balance < order.quantity:
                # No asset to sell — the sibling order already sold it.
                # Cancel this order instead of executing it.
                order.status = OrderStatus.CANCELLED
                logger.info(
                    f"Cancelled {order.type.value} order {order.id}: "
                    f"insufficient {base_asset} balance "
                    f"(available={target_asset.available_balance if target_asset else 0}, "
                    f"needed={order.quantity})"
                )
                return
            
            # Deduct asset
            target_asset.total_balance -= order.quantity
            target_asset.available_balance -= order.quantity
            
            # Calculate PnL and return margin
            leverage = user.default_leverage or 100
            notional_entry = order.quantity * target_asset.average_buy_price
            notional_exit = order.quantity * execution_price
            pnl = notional_exit - notional_entry
            margin_returned = notional_entry / leverage
            
            # Credit USD balance
            user.trading_balance += (margin_returned + pnl)

            # Reset average buy price if closed completely
            if target_asset.total_balance <= 0.000001:
                target_asset.average_buy_price = 0.0

        # Record Transaction
        txn = Transaction(
            id=str(uuid.uuid4()),
            user_id=user.id,
            type=TransactionType.TRADE,
            asset_symbol=base_asset,
            amount=order.quantity,
            usd_amount=cost_estimate if order.side == OrderSide.BUY else -cost_estimate,
            description=f"Executed {order.type.value} {order.side.value} {order.symbol}",
            reference_id=order.id
        )
        db.add(txn)
        
        order.status = OrderStatus.FILLED
        order.executed_quantity = order.quantity
        order.average_price = execution_price
        
        # --- OCO: Cancel sibling TP/SL orders ---
        # When a TP or SL fills, cancel ALL other pending TP/SL orders
        # for the same user + symbol + quantity (the paired exit orders).
        if order.type in [OrderType.TAKE_PROFIT, OrderType.STOP_LOSS]:
            sibling_type = (
                OrderType.STOP_LOSS if order.type == OrderType.TAKE_PROFIT
                else OrderType.TAKE_PROFIT
            )
            sibling_stmt = select(Order).where(
                Order.user_id == order.user_id,
                Order.symbol == order.symbol,
                Order.type == sibling_type,
                Order.status == OrderStatus.PENDING,
                Order.quantity == order.quantity,
            )
            sibling_result = await db.execute(sibling_stmt)
            siblings = sibling_result.scalars().all()
            for sib in siblings:
                sib.status = OrderStatus.CANCELLED
                logger.info(
                    f"OCO: Cancelled sibling {sib.type.value} order {sib.id} "
                    f"because {order.type.value} order {order.id} was filled"
                )

        # Spawn TP and SL orders if it was a LIMIT order
        if order.type == OrderType.LIMIT:
            if order.take_profit:
                tp_order = Order(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    symbol=order.symbol,
                    type=OrderType.TAKE_PROFIT,
                    side=OrderSide.SELL if order.side == OrderSide.BUY else OrderSide.BUY,
                    status=OrderStatus.PENDING,
                    quantity=order.quantity,
                    price=order.take_profit
                )
                db.add(tp_order)
            if order.stop_price:
                sl_order = Order(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    symbol=order.symbol,
                    type=OrderType.STOP_LOSS,
                    side=OrderSide.SELL if order.side == OrderSide.BUY else OrderSide.BUY,
                    status=OrderStatus.PENDING,
                    quantity=order.quantity,
                    stop_price=order.stop_price
                )
                db.add(sl_order)

# Global instance
order_matching_engine = OrderMatchingEngine()
