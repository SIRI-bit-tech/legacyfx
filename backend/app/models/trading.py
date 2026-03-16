from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Enum, Text, ForeignKey
from datetime import datetime
import enum
from app.database import Base

class OrderType(str, enum.Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP_LOSS = "STOP_LOSS"
    TAKE_PROFIT = "TAKE_PROFIT"

class OrderSide(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    OPEN = "OPEN"
    FILLED = "FILLED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    REJECTED = "REJECTED"

class TradingPair(Base):
    __tablename__ = "trading_pairs"

    id = Column(String(36), primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True, nullable=False) # e.g., BTC/USD
    base_asset = Column(String(10), nullable=False) # BTC
    quote_asset = Column(String(10), nullable=False) # USD
    binance_symbol = Column(String(20), nullable=True) # BTCUSDT
    
    is_active = Column(Boolean, default=True)
    min_order_qty = Column(Float, default=0.0)
    max_order_qty = Column(Float, default=0.0)
    price_precision = Column(Integer, default=2)
    qty_precision = Column(Integer, default=8)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    symbol = Column(String(20), index=True, nullable=False)
    
    type = Column(Enum(OrderType), nullable=False)
    side = Column(Enum(OrderSide), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=True) # Null for MARKET orders
    stop_price = Column(Float, nullable=True)
    
    executed_quantity = Column(Float, default=0.0)
    average_price = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserAsset(Base):
    __tablename__ = "user_assets"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    asset_symbol = Column(String(10), index=True, nullable=False)
    
    total_balance = Column(Float, default=0.0)
    available_balance = Column(Float, default=0.0)
    locked_balance = Column(Float, default=0.0) # For open orders
    
    average_buy_price = Column(Float, default=0.0)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    symbol = Column(String(20), nullable=False)
    target_price = Column(Float, nullable=False)
    condition = Column(String(10), nullable=False) # ABOVE, BELOW
    
    is_active = Column(Boolean, default=True)
    is_triggered = Column(Boolean, default=False)
    triggered_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class ExecutionTrade(Base):
    __tablename__ = "execution_trades"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    order_id = Column(String(36), index=True, nullable=False)
    symbol = Column(String(20), nullable=False)
    
    side = Column(Enum(OrderSide), nullable=False)
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    fee = Column(Float, default=0.0)
    fee_asset = Column(String(10), default="USD")
    
    pnl = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
