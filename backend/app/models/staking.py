from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, Boolean, Integer, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum
import uuid
from app.database import Base

class StakingType(str, enum.Enum):
    """Pool type: FLEXIBLE (anytime unstake) or FIXED (lock for N days)"""
    FLEXIBLE = "FLEXIBLE"
    FIXED_30 = "FIXED_30"
    FIXED_90 = "FIXED_90"
    FIXED_180 = "FIXED_180"

class PayoutFrequency(str, enum.Enum):
    """When rewards are paid out"""
    DAILY = "DAILY"
    MONTHLY = "MONTHLY"
    END_OF_TERM = "END_OF_TERM"

class StakingStatus(str, enum.Enum):
    """Position status"""
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"

class RewardStatus(str, enum.Enum):
    """Reward lifecycle status"""
    ACCRUED = "ACCRUED"
    PAID = "PAID"
    CLAIMED = "CLAIMED"

class RewardType(str, enum.Enum):
    """How reward was earned"""
    DAILY_ACCRUAL = "DAILY_ACCRUAL"
    MONTHLY_PAYOUT = "MONTHLY_PAYOUT"
    TERM_END = "TERM_END"

class StakingProduct(Base):
    """Staking pool template created by admin"""
    __tablename__ = "staking_products"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_symbol = Column(String(20), nullable=False, index=True)
    staking_type = Column(Enum(StakingType), nullable=False, index=True)  # FLEXIBLE or FIXED_N
    annual_percentage_yield = Column(Float, nullable=False)  # e.g., 8.5, 14.2
    min_stake_amount = Column(Float, default=0.0, nullable=False)
    lock_period_days = Column(Integer, nullable=True)  # NULL for FLEXIBLE, 30/90/180 for FIXED
    payout_frequency = Column(Enum(PayoutFrequency), default=PayoutFrequency.DAILY, nullable=False)
    pool_capacity_amount = Column(Float, nullable=True)  # NULL for unlimited
    current_total_staked = Column(Float, default=0.0, nullable=False)  # Running sum
    is_active = Column(Boolean, default=True, index=True)
    created_by_admin_id = Column(String, ForeignKey("admins.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    positions = relationship("StakingPosition", back_populates="pool", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_staking_product_type_active', 'staking_type', 'is_active'),
        Index('idx_staking_product_asset', 'asset_symbol'),
    )

class StakingPosition(Base):
    """User's active or completed stake"""
    __tablename__ = "staking_positions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    pool_id = Column(String, ForeignKey("staking_products.id"), nullable=False, index=True)
    amount_staked = Column(Float, nullable=False)
    usd_value_at_staking = Column(Float, nullable=False)  # Snapshot for history
    total_earned_amount = Column(Float, default=0.0, nullable=False)  # Cumulative earned
    status = Column(Enum(StakingStatus), default=StakingStatus.ACTIVE, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    earned_until_date = Column(DateTime, nullable=True)  # When fixed term ends
    last_payout_at = Column(DateTime, nullable=True)  # Last reward payout
    closed_at = Column(DateTime, nullable=True)  # When unstaked/completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="staking_positions")
    pool = relationship("StakingProduct", back_populates="positions")
    rewards = relationship("StakingReward", back_populates="position", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_staking_position_active_user', 'user_id', 'is_active'),
        Index('idx_staking_position_pool', 'pool_id'),
    )

class StakingReward(Base):
    """Immutable reward record for a staking position"""
    __tablename__ = "staking_rewards"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    position_id = Column(String, ForeignKey("staking_positions.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    earned_on_date = Column(DateTime, nullable=False, index=True)  # When reward accrued
    paid_on_date = Column(DateTime, nullable=True)  # When transferred to user
    status = Column(Enum(RewardStatus), default=RewardStatus.ACCRUED, nullable=False)
    reward_type = Column(Enum(RewardType), default=RewardType.DAILY_ACCRUAL, nullable=False)
    usd_amount_at_payout = Column(Float, nullable=True)  # Snapshot
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    position = relationship("StakingPosition", back_populates="rewards")
    
    __table_args__ = (
        Index('idx_staking_reward_position_status', 'position_id', 'status'),
    )
