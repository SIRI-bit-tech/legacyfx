from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Enum, Text, ForeignKey
from datetime import datetime
import enum
from app.database import Base

class InvestmentType(str, enum.Enum):
    FIXED = "FIXED"
    FLEXIBLE = "FLEXIBLE"
    STAKING = "STAKING"
    MINING = "MINING"
    REAL_ESTATE = "REAL_ESTATE"

class InvestmentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MATURED = "MATURED"
    REDEEMED = "REDEEMED"
    CLOSED = "CLOSED"

class InvestmentProduct(Base):
    __tablename__ = "investment_products"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(InvestmentType), nullable=False)
    asset_symbol = Column(String(10), nullable=False)
    
    apy = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=True) # Null for flexible
    min_investment = Column(Float, default=0.0)
    max_investment = Column(Float, nullable=True)
    
    total_staked = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class InvestmentPosition(Base):
    __tablename__ = "investment_positions"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    product_id = Column(String(36), nullable=False)
    
    amount = Column(Float, nullable=False)
    apy_at_start = Column(Float, nullable=False)
    
    status = Column(Enum(InvestmentStatus), default=InvestmentStatus.ACTIVE)
    total_earnings = Column(Float, default=0.0)
    
    started_at = Column(DateTime, default=datetime.utcnow)
    maturity_date = Column(DateTime, nullable=True)
    redeemed_at = Column(DateTime, nullable=True)

class CopyTrader(Base):
    __tablename__ = "copy_traders"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), unique=True, nullable=False) # Reference to users.id
    username = Column(String(100), nullable=False)
    bio = Column(Text, nullable=True)
    
    win_rate = Column(Float, default=0.0)
    total_pnl_percent = Column(Float, default=0.0)
    avg_trade_duration = Column(String(50), nullable=True)
    followers_count = Column(Integer, default=0)
    
    performance_data = Column(Text, nullable=True) # JSON historical performance
    is_active = Column(Boolean, default=True)

class CopySession(Base):
    __tablename__ = "copy_sessions"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False) # Copier
    trader_id = Column(String(36), nullable=False) # The trader being copied
    
    allocation_amount = Column(Float, nullable=False)
    current_pnl = Column(Float, default=0.0)
    status = Column(String(20), default="ACTIVE") # ACTIVE, ENDED
    
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
