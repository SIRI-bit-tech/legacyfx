from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, Text, Boolean, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class AccountType(str, enum.Enum):
    TRADING = "TRADING"
    SAVINGS = "SAVINGS"
    INVESTMENT = "INVESTMENT"
    MINING = "MINING"

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    account_type = Column(Enum(AccountType), default=AccountType.TRADING)
    nickname = Column(String(100))
    balance = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")
