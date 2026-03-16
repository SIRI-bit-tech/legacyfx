from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class SignalType(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"

class Signal(Base):
    __tablename__ = "signals"
    
    id = Column(String, primary_key=True)
    analyst_id = Column(String, ForeignKey("users.id"))
    symbol = Column(String(20), nullable=False)
    signal_type = Column(Enum(SignalType), nullable=False)
    entry_price = Column(Float)
    target_price = Column(Float)
    stop_loss = Column(Float)
    confidence = Column(Float)
    analysis = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    analyst = relationship("User", back_populates="signals")
