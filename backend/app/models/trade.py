from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, Boolean, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class TradeType(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"

class TradeStatus(str, enum.Enum):
    PENDING = "PENDING"
    FILLED = "FILLED"
    PARTIAL = "PARTIAL"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    symbol = Column(String(20), nullable=False)
    trade_type = Column(Enum(TradeType), nullable=False)
    quantity = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float)
    exit_price = Column(Float)
    status = Column(Enum(TradeStatus), default=TradeStatus.PENDING)
    commission = Column(Float, default=0.0)
    pnl = Column(Float)
    pnl_percentage = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime)
    
    user = relationship("User", back_populates="trades")
