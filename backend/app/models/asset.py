from sqlalchemy import Column, String, Float, DateTime, Boolean, Text
from datetime import datetime
from app.database import Base

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(String, primary_key=True)
    symbol = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    coingecko_id = Column(String(100), unique=True)
    current_price = Column(Float, default=0.0)
    market_cap = Column(Float)
    market_cap_rank = Column(Float)
    total_volume = Column(Float)
    high_24h = Column(Float)
    low_24h = Column(Float)
    price_change_24h = Column(Float)
    price_change_percentage_24h = Column(Float)
    circulating_supply = Column(Float)
    total_supply = Column(Float)
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
