from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class LoginHistory(Base):
    __tablename__ = "login_history"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    device_fingerprint = Column(String(255))
    login_timestamp = Column(DateTime, default=datetime.utcnow)
    logout_timestamp = Column(DateTime)
    is_suspicious = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="login_history")

class TrustedDevice(Base):
    __tablename__ = "trusted_devices"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    device_name = Column(String(255))
    device_fingerprint = Column(String(255), unique=True)
    last_used = Column(DateTime, default=datetime.utcnow)
    is_trusted = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="trusted_devices")

class TokenBlocklist(Base):
    __tablename__ = "token_blocklist"
    
    id = Column(String, primary_key=True)
    jti = Column(String(36), unique=True, index=True, nullable=False) # JWT ID
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

