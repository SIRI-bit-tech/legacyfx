from sqlalchemy import Column, String, Float, DateTime, UniqueConstraint
from datetime import datetime
from app.database import Base

class MiningStats(Base):
    __tablename__ = "mining_stats"
    __table_args__ = (
        UniqueConstraint('coin_symbol', name='uq_mining_stats_coin_symbol'),
    )
    
    id = Column(String(36), primary_key=True)
    coin_symbol = Column(String(20), nullable=False, unique=True)
    network_hashrate = Column(String(50), nullable=True)
    difficulty = Column(String(50), nullable=True)
    next_difficulty_est = Column(String(50), nullable=True)
    block_time_avg = Column(Float, nullable=True)
    daily_revenue_per_hash = Column(Float, nullable=True)
    active_miners_count = Column(Float, nullable=True)
    total_platform_hashrate = Column(String(50), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
