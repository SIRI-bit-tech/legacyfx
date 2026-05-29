from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.database import Base

class WalletType(str, enum.Enum):
    CRYPTO = "CRYPTO"
    FIAT = "FIAT"
    COLD_STORAGE = "COLD_STORAGE"

class Wallet(Base):
    __tablename__ = "wallets"
    __table_args__ = (
        UniqueConstraint('user_id', 'address_normalized', name='uq_wallet_user_address_normalized'),
    )
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    wallet_type = Column(Enum(WalletType), nullable=False)
    asset_symbol = Column(String(20), nullable=False)
    balance = Column(Float, default=0.0)
    address = Column(String(500))
    address_normalized = Column(String(500), index=True)
    qr_code_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="wallets")
