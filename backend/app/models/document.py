from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class DocumentType(str, enum.Enum):
    PASSPORT = "PASSPORT"
    ID_CARD = "ID_CARD"
    DRIVERS_LICENSE = "DRIVERS_LICENSE"
    PROOF_OF_ADDRESS = "PROOF_OF_ADDRESS"
    BANK_STATEMENT = "BANK_STATEMENT"

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    document_type = Column(Enum(DocumentType), nullable=False)
    cloudinary_url = Column(String(500), nullable=False)
    cloudinary_public_id = Column(String(255))
    is_verified = Column(String(20), default="PENDING")
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime)
    
    user = relationship("User", back_populates="documents")
