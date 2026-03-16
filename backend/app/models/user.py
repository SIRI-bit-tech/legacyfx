from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Enum, Text
from datetime import datetime
import enum
from app.database import Base

class UserTier(str, enum.Enum):
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    PLATINUM = "PLATINUM"
    DIAMOND = "DIAMOND"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"

class KYCStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    
    # Auth & Security
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(100), nullable=True)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(100), nullable=True)
    backup_codes = Column(Text, nullable=True) # JSON string
    
    # Profile & Status
    profile_picture_url = Column(String(500), nullable=True)
    tier = Column(Enum(UserTier), default=UserTier.BRONZE)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.UNVERIFIED)
    kyc_rejection_reason = Column(Text, nullable=True)
    
    # Financials
    # account_balance is total across all accounts in USD
    account_balance = Column(Float, default=0.0)
    trading_balance = Column(Float, default=0.0)
    cold_storage_balance = Column(Float, default=0.0)
    
    # Referral
    referral_code = Column(String(20), unique=True, index=True)
    referred_by = Column(String(36), nullable=True) 
    referral_earnings = Column(Float, default=0.0)
    
    # Timestamps
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

