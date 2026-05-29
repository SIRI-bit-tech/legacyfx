from sqlalchemy import Column, String, DateTime, Enum, Text, Boolean
from datetime import datetime
import enum
from app.database import Base

class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)
    
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN)
    priority = Column(String(20), default="NORMAL")
    
    assigned_to = Column(String(36), nullable=True) # Admin user ID
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TicketMessage(Base):
    __tablename__ = "support_messages"
    
    id = Column(String(36), primary_key=True, index=True)
    ticket_id = Column(String(36), index=True, nullable=False)
    sender_id = Column(String(36), nullable=False)
    
    message = Column(Text, nullable=False)
    is_admin = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
