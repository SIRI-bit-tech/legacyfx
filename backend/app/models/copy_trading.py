"""
Copy Trading Model - Tracks user's copy trading sessions with Bitget
"""
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.database import Base


class CopyModeEnum(str, enum.Enum):
    PROPORTIONAL = "proportional"
    FIXED_AMOUNT = "fixed_amount"
    PERCENTAGE = "percentage"


class CopyStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    STOPPED = "STOPPED"


class CopyTrading(Base):
    """
    Stores copy trading sessions - tracks user's active copy trading configurations
    """
    __tablename__ = "copy_trading"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # User relationship
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    user = relationship("User", backref="copy_trading_sessions")
    
    # Bitget identifiers
    bitget_copy_id = Column(String(255), unique=True, nullable=False, index=True)
    bitget_trader_id = Column(String(255), nullable=False)
    trader_username = Column(String(255), nullable=False)
    
    # Copy configuration
    copy_mode = Column(SQLEnum(CopyModeEnum), nullable=False)
    status = Column(SQLEnum(CopyStatus), default=CopyStatus.ACTIVE, nullable=False)
    
    # Copy settings
    leverage = Column(Float, default=1.0)  # For proportional mode
    fixed_amount = Column(Float, nullable=True)  # For fixed amount mode
    percentage = Column(Float, nullable=True)  # For percentage mode (0-100)
    
    # Risk management settings
    max_position_size = Column(Float, default=5000.0)  # Max USD per position
    stop_loss_enabled = Column(Boolean, default=True)
    stop_loss_percentage = Column(Float, default=5.0)
    take_profit_enabled = Column(Boolean, default=True)
    take_profit_percentage = Column(Float, default=10.0)
    max_daily_copy_trades = Column(Integer, default=20)
    
    # Auto stop settings
    auto_stop_on_loss = Column(Boolean, default=True)
    auto_stop_loss_threshold = Column(Float, default=1000.0)  # Stop if lost this much USD
    
    # Performance tracking
    total_copied_trades = Column(Integer, default=0)
    total_pnl = Column(Float, default=0.0)  # Total P&L in USD
    total_pnl_percentage = Column(Float, default=0.0)  # Total P&L %
    win_count = Column(Integer, default=0)
    loss_count = Column(Integer, default=0)
    cumulative_loss = Column(Float, default=0.0)  # Cumulative loss tracking
    daily_trades_count = Column(Integer, default=0)  # Trades today
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    stopped_at = Column(DateTime, nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<CopyTrading(user_id={self.user_id}, trader_id={self.bitget_trader_id}, status={self.status})>"


class CopyTradeHistory(Base):
    """
    Individual trades copied from a master trader
    """
    __tablename__ = "copy_trade_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Copy trading session reference
    copy_trading_id = Column(String(36), ForeignKey("copy_trading.id"), nullable=False, index=True)
    copy_trading = relationship("CopyTrading", backref="trade_history")
    
    # Trade details
    bitget_trade_id = Column(String(255), unique=True, nullable=False)
    symbol = Column(String(20), nullable=False)  # BTC/USDT, ETH/USDT, etc.
    side = Column(String(10), nullable=False)  # buy or sell
    
    # Price & quantity
    quantity = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=True)
    
    # P&L tracking
    pnl = Column(Float, default=0.0)  # P&L in USD
    pnl_percentage = Column(Float, default=0.0)  # P&L %
    
    # Status
    status = Column(String(20), default="OPEN")  # OPEN or CLOSED
    
    # Timestamps
    opened_at = Column(DateTime, nullable=False)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<CopyTradeHistory(symbol={self.symbol}, status={self.status}, pnl={self.pnl})>"
