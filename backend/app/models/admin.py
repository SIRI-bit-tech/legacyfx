from sqlalchemy import Column, String, DateTime, Enum
from datetime import datetime
import enum
from app.database import Base

class AdminStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"

class Admin(Base):
    __tablename__ = "admins"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    password_hash = Column(String(255), nullable=False)
    status = Column(Enum(AdminStatus), default=AdminStatus.ACTIVE, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
