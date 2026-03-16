from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class RealEstateProperty(Base):
    __tablename__ = "real_estate_properties"
    
    id = Column(String, primary_key=True)
    name = Column(String(200), nullable=False)
    location = Column(String(200), nullable=False)
    description = Column(Text)
    value = Column(Float, nullable=False)
    annual_roi = Column(Float, nullable=False)
    tokens_issued = Column(Float, nullable=False)
    tokens_available = Column(Float, nullable=False)
    min_investment = Column(Float, nullable=False)
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class RealEstateInvestment(Base):
    __tablename__ = "real_estate_investments"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    property_id = Column(String, ForeignKey("real_estate_properties.id"), nullable=False)
    tokens_purchased = Column(Float, nullable=False)
    amount_invested = Column(Float, nullable=False)
    earnings = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="real_estate_investments")
    property = relationship("RealEstateProperty")
