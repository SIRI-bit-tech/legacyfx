from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class MiningStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class MiningPlan(Base):
    __tablename__ = "mining_plans"
    
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    coin_symbol = Column(String(20), nullable=False)
    hashrate = Column(String(50), nullable=False)
    daily_earnings = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    duration_days = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class MiningSubscription(Base):
    __tablename__ = "mining_subscriptions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    plan_id = Column(String, ForeignKey("mining_plans.id"), nullable=False)
    status = Column(Enum(MiningStatus), default=MiningStatus.PENDING)
    total_earnings = Column(Float, default=0.0)
    last_paid_at = Column(DateTime, nullable=True)  # Track last payout date for idempotency
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="mining_subscriptions")
    plan = relationship("MiningPlan")
