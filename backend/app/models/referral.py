from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(String, primary_key=True)
    referrer_id = Column(String, ForeignKey("users.id"), nullable=False)
    referred_id = Column(String, ForeignKey("users.id"), nullable=False)
    commission_rate = Column(Float, default=0.05)
    commission_earned = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    referrer = relationship("User", foreign_keys=[referrer_id], back_populates="referrals_made")
    referred = relationship("User", foreign_keys=[referred_id], back_populates="referrals_received")
