from sqlalchemy import Column, String, DateTime, Boolean, Text
from datetime import datetime
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    
    type = Column(String(50), nullable=False) # TRADE, DEPOSIT, WITHDRAWAL, SECURITY, etc.
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    is_read = Column(Boolean, default=False)
    link = Column(String(500), nullable=True) # Optional link to open when clicked
    
    created_at = Column(DateTime, default=datetime.utcnow)
