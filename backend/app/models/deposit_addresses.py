"""Admin-managed deposit addresses for Assets deposits."""

from sqlalchemy import Column, String, Float, DateTime, Boolean, UniqueConstraint
from datetime import datetime

from app.database import Base


class DepositAddress(Base):
    __tablename__ = "deposit_addresses"

    id = Column(String(36), primary_key=True, index=True)
    asset = Column(String(10), index=True, nullable=False)
    network = Column(String(50), index=True, nullable=False)

    address = Column(String(255), nullable=False)
    qr_code_url = Column(String(512), nullable=False)

    min_deposit = Column(Float, nullable=False, default=0.0)
    fee = Column(Float, nullable=False, default=0.0)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("asset", "network", name="uq_deposit_addresses_asset_network"),
    )

