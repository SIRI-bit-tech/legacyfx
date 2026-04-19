from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean, Enum, Integer, Numeric, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

# Constants for foreign keys to avoid duplication
USERS_ID = "users.id"
REFERRALS_ID = "referrals.id"

class ReferralStatus(str, enum.Enum):
    PENDING = "PENDING"      # Signed up but no deposit yet
    ACTIVE = "ACTIVE"        # Made first deposit, earning commissions
    INACTIVE = "INACTIVE"    # Account suspended or closed

class CommissionStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    CANCELLED = "CANCELLED"

class CommissionSourceType(str, enum.Enum):
    TRADE = "TRADE"
    DEPOSIT = "DEPOSIT"

class PayoutStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(String(36), primary_key=True, index=True)
    referrer_id = Column(String(36), ForeignKey(USERS_ID), nullable=False, index=True)
    referred_id = Column(String(36), ForeignKey(USERS_ID), nullable=False, index=True)
    referral_code = Column(String(100), nullable=False, index=True)
    status = Column(Enum(ReferralStatus), default=ReferralStatus.PENDING, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    activated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    referrer = relationship("User", foreign_keys=[referrer_id], back_populates="referrals_made")
    referred = relationship("User", foreign_keys=[referred_id], back_populates="referrals_received")

class ReferralCommission(Base):
    __tablename__ = "referral_commissions"
    
    id = Column(String(36), primary_key=True, index=True)
    referrer_id = Column(String(36), ForeignKey(USERS_ID), nullable=False, index=True)
    referred_id = Column(String(36), ForeignKey(USERS_ID), nullable=False, index=True)
    referral_id = Column(String(36), ForeignKey(REFERRALS_ID), nullable=False, index=True)
    source_type = Column(Enum(CommissionSourceType), nullable=False)
    source_amount = Column(Numeric(18, 8), nullable=False)
    commission_rate = Column(Numeric(10, 4), nullable=False)
    commission_amount = Column(Numeric(18, 8), nullable=False)
    tier = Column(Integer, nullable=False)
    status = Column(Enum(CommissionStatus), default=CommissionStatus.PENDING, nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class ReferralPayout(Base):
    __tablename__ = "referral_payouts"
    
    id = Column(String(36), primary_key=True, index=True)
    referrer_id = Column(String(36), ForeignKey(USERS_ID), nullable=False, index=True)
    total_amount = Column(Numeric(18, 8), nullable=False)
    commission_count = Column(Integer, nullable=False)
    status = Column(Enum(PayoutStatus), default=PayoutStatus.PENDING, nullable=False)
    payout_date = Column(Date, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
