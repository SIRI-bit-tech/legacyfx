from sqlalchemy import Column, String, Integer, Numeric, DateTime, Boolean, Enum, JSON, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from app.database import Base

class AssetType(str, enum.Enum):
    CRYPTO = "crypto"
    FOREX = "forex"
    STOCKS = "stocks"

class SignalType(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"

class SignalStrength(str, enum.Enum):
    STRONG = "strong"
    MODERATE = "moderate"
    WEAK = "weak"

class SignalOutcome(str, enum.Enum):
    PENDING = "pending"
    WIN = "win"
    LOSS = "loss"
    EXPIRED = "expired"

class CopyStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    CANCELLED = "cancelled"

class Signal(Base):
    __tablename__ = "signals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, index=True)
    asset_type = Column(Enum(AssetType), index=True)
    signal_type = Column(Enum(SignalType))
    strength = Column(Enum(SignalStrength))
    timeframe = Column(String)  # 15m, 1h, 4h, etc.
    
    entry_price = Column(Numeric(precision=20, scale=10))
    take_profit = Column(Numeric(precision=20, scale=10))
    stop_loss = Column(Numeric(precision=20, scale=10))
    
    # Advanced metrics
    rsi = Column(Numeric(precision=10, scale=4), nullable=True)
    macd = Column(String, nullable=True)  # bullish/bearish
    ema_signal = Column(String, nullable=True) # golden/death cross
    bb_signal = Column(String, nullable=True)
    sma_signal = Column(String, nullable=True)
    indicators_raw = Column(JSON, nullable=True)
    
    generated_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class SignalHistory(Base):
    __tablename__ = "signal_history"

    id = Column(Integer, primary_key=True)
    signal_id = Column(String, index=True)
    symbol = Column(String, index=True)
    asset_type = Column(Enum(AssetType))
    signal_type = Column(Enum(SignalType))
    entry_price = Column(Numeric(precision=20, scale=10))
    exit_price = Column(Numeric(precision=20, scale=10), nullable=True)
    outcome = Column(Enum(SignalOutcome))
    result_percent = Column(Numeric(precision=10, scale=4), nullable=True)
    timeframe = Column(String)
    generated_at = Column(DateTime)
    closed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class CopiedSignal(Base):
    __tablename__ = "copied_signals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    signal_id = Column(String, ForeignKey("signals.id"))
    symbol = Column(String)
    signal_type = Column(Enum(SignalType))
    entry_price = Column(Numeric(precision=20, scale=10))
    take_profit = Column(Numeric(precision=20, scale=10))
    stop_loss = Column(Numeric(precision=20, scale=10))
    status = Column(Enum(CopyStatus), default=CopyStatus.ACTIVE)
    copied_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to the original signal
    original_signal = relationship("Signal")

class SignalAccuracy(Base):
    __tablename__ = "signal_accuracy"
    
    id = Column(Integer, primary_key=True)
    symbol = Column(String, index=True)
    asset_type = Column(Enum(AssetType))
    signal_type = Column(Enum(SignalType))
    total_signals = Column(Integer, default=0)
    winning_signals = Column(Integer, default=0)
    accuracy_percent = Column(Numeric(precision=5, scale=2), default=0.0)
    last_calculated_at = Column(DateTime, default=datetime.utcnow)

# Generic Cache Table for API results
class SignalCache(Base):
    __tablename__ = "signal_generic_cache"
    
    id = Column(Integer, primary_key=True)
    cache_key = Column(String, unique=True, index=True)
    data = Column(JSON)
    fetched_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, index=True)
