from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class DepositStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"

class WithdrawalStatus(str, enum.Enum):
    PENDING_2FA = "PENDING_2FA"
    AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class TransactionType(str, enum.Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    TRADE = "TRADE"
    STAKING_DEPOSIT = "STAKING_DEPOSIT"
    STAKING_WITHDRAWAL = "STAKING_WITHDRAWAL"
    STAKING_REWARD = "STAKING_REWARD"
    MINING_REWARD = "MINING_REWARD"
    INVESTMENT_RETURN = "INVESTMENT_RETURN"
    REFERRAL_COMMISSION = "REFERRAL_COMMISSION"
    SUBSCRIPTION_PAYMENT = "SUBSCRIPTION_PAYMENT"
    SUBSCRIPTION_REQUEST = "SUBSCRIPTION_REQUEST"
    COLD_STORAGE_DEPOSIT = "COLD_STORAGE_DEPOSIT"
    COLD_STORAGE_WITHDRAWAL = "COLD_STORAGE_WITHDRAWAL"

class Deposit(Base):
    __tablename__ = "deposits"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    asset_symbol = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    fiat_amount = Column(Float, nullable=True) # USD equivalent at time of deposit
    
    # Provider details
    wallet_address = Column(String(255), nullable=True)
    blockchain_network = Column(String(50), nullable=True)
    transaction_hash = Column(String(255), nullable=True, unique=True)
    
    status = Column(Enum(DepositStatus), default=DepositStatus.PENDING)
    confirmed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    asset_symbol = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    fee = Column(Float, default=0.0)
    net_amount = Column(Float, nullable=False)
    
    destination_address = Column(String(255), nullable=False)
    blockchain_network = Column(String(50), nullable=True)
    transaction_hash = Column(String(255), nullable=True, unique=True)
    
    status = Column(Enum(WithdrawalStatus), default=WithdrawalStatus.PENDING_2FA)
    rejection_reason = Column(Text, nullable=True)

    # Email-confirm-first flow for user withdrawals
    confirmation_token = Column(String(255), nullable=True, index=True)
    confirmation_expires_at = Column(DateTime, nullable=True)
    
    approved_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=True)
    type = Column(Enum(TransactionType), nullable=False)
    
    asset_symbol = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    usd_amount = Column(Float, nullable=True)
    
    description = Column(String(255), nullable=True)
    reference_id = Column(String(36), nullable=True) # ID of Deposit, Withdrawal, Trade, etc.
    
    status = Column(String(20), default="COMPLETED")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")

class ColdStorageVault(Base):
    __tablename__ = "cold_storage_vaults"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, unique=True, nullable=False)
    asset_symbol = Column(String(10), nullable=False)
    balance = Column(Float, default=0.0)
    is_locked = Column(Boolean, default=True)
    last_withdrawal_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    tier = Column(String(20), nullable=False) # BASIC, PRO, ELITE, LEGACY_MASTER
    price = Column(Float, nullable=False) # In USD
    features = Column(Text, nullable=True) # JSON features list
    is_active = Column(Boolean, default=True)

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    plan_id = Column(String(36), nullable=False)
    status = Column(String(20), default="PENDING") # PENDING, ACTIVE, CANCELLED, EXPIRED, REJECTED
    payment_proof = Column(String(255), nullable=True) # Optional link or reference
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    auto_renew = Column(Boolean, default=True)
