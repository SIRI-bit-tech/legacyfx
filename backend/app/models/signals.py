from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Enum, Text, ForeignKey
from datetime import datetime
import enum
from app.database import Base

class SignalAction(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"

class SignalSource(Base):
    __tablename__ = "signal_sources"
    
    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    accuracy_percent = Column(Float, default=0.0)
    total_trades = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class TradingSignal(Base):
    __tablename__ = "trading_signals"

    id = Column(String(36), primary_key=True, index=True)
    source_id = Column(String(36), index=True, nullable=False)
    symbol = Column(String(20), index=True, nullable=False)
    
    action = Column(Enum(SignalAction), nullable=False)
    entry_price = Column(Float, nullable=False)
    target_price = Column(Float, nullable=False)
    stop_loss = Column(Float, nullable=False)
    
    accuracy = Column(Float, nullable=True) # Predicted accuracy (0-100)
    status = Column(String(20), default="ACTIVE") # ACTIVE, EXPIRED, HIT_TARGET, HIT_STOP
    
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
