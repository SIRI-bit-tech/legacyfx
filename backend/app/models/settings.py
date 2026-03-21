from sqlalchemy import Column, String, DateTime, Float
from datetime import datetime
from app.database import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(String(36), primary_key=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(String(1000), nullable=True)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
