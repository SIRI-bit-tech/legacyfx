from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, Boolean, Integer
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum
from app.database import Base

class StakingStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    UNSTAKING = "UNSTAKING"
    COMPLETED = "COMPLETED"

class StakingProduct(Base):
    __tablename__ = "staking_products"
    
    id = Column(String, primary_key=True)
    asset_symbol = Column(String(20), nullable=False)
    apy = Column(Float, nullable=False)
    min_amount = Column(Float, default=0.0)
    lock_period_days = Column(Integer)
    is_flexible = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class StakingPosition(Base):
    __tablename__ = "staking_positions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    product_id = Column(String, ForeignKey("staking_products.id"), nullable=False)
    amount_staked = Column(Float, nullable=False)
    rewards_earned = Column(Float, default=0.0)
    status = Column(Enum(StakingStatus), default=StakingStatus.ACTIVE)
    start_date = Column(DateTime, default=datetime.utcnow)
    unlock_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="staking_positions")
    product = relationship("StakingProduct")
