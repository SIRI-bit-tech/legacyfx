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
