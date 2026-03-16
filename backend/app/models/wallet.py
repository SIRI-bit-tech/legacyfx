from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class WalletType(str, enum.Enum):
    CRYPTO = "CRYPTO"
    FIAT = "FIAT"
    COLD_STORAGE = "COLD_STORAGE"

class Wallet(Base):
    __tablename__ = "wallets"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    wallet_type = Column(Enum(WalletType), nullable=False)
    asset_symbol = Column(String(20), nullable=False)
    balance = Column(Float, default=0.0)
    address = Column(String(500), unique=True)
    qr_code_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="wallets")
