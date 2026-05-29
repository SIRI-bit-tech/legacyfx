from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Boolean, Numeric, JSON, Enum, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from app.database import Base

class InvestmentStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    EXITED = "exited"

class RealEstateTransactionType(str, enum.Enum):
    FRACTIONAL_INVESTMENT = "fractional_investment"
    DIVIDEND = "dividend"
    EXIT = "exit"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class RealEstateProperty(Base):
    __tablename__ = "real_estate_properties"
    
    id = Column(String, primary_key=True)
    name = Column(String(200), nullable=False)
    location = Column(String(200), nullable=False)
    description = Column(Text)
    value = Column(Float, nullable=False)
    annual_roi = Column(Float, nullable=False)
    tokens_issued = Column(Float, nullable=False)
    tokens_available = Column(Float, nullable=False)
    min_investment = Column(Float, nullable=False)
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class RealEstateInvestment(Base):
    __tablename__ = "real_estate_investments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    external_property_id = Column(String(100), nullable=False)
    property_snapshot = Column(JSON, nullable=False)
    tokens_owned = Column(Integer, default=0)
    amount_invested = Column(Numeric(18, 8), nullable=False)
    current_value = Column(Numeric(18, 8), nullable=False)
    monthly_income = Column(Numeric(18, 8), default=0)
    roi_percent = Column(Numeric(10, 4), default=0)
    status = Column(Enum(InvestmentStatus), default=InvestmentStatus.ACTIVE)
    
    invested_at = Column(DateTime, default=datetime.utcnow)
    exited_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Legacy relationships - kept for backward compatibility if needed by existing queries
    user = relationship("User", back_populates="real_estate_investments")

class RealEstateTransaction(Base):
    __tablename__ = "real_estate_transactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    external_property_id = Column(String(100), nullable=False)
    property_title = Column(String(200), nullable=False)
    type = Column(Enum(RealEstateTransactionType))
    amount = Column(Numeric(18, 8), nullable=False)
    tokens = Column(Integer, nullable=True)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    payment_source = Column(String(50)) # e.g. "platform_balance"
    created_at = Column(DateTime, default=datetime.utcnow)

class RealEstateCache(Base):
    __tablename__ = "real_estate_cache"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cache_key = Column(String(255), unique=True, index=True)
    data = Column(JSON)
    fetched_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
