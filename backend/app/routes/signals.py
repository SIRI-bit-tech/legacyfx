from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.signals import TradingSignal, SignalSource, SignalAction
from app.utils.auth import get_current_user
from app.schemas.signal import SignalSourceResponse, SignalResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/signals", tags=["signals"])

class SignalResponse(BaseModel):
    id: str
    source_name: str
    symbol: str
    action: str
    entry_price: float
    target_price: float
    stop_loss: float
    accuracy_percent: Optional[float]
    status: str
    created_at: datetime

@router.get("/", response_model=List[SignalResponse])
async def get_signals(db: AsyncSession = Depends(get_db)):
    """Fetch all active trading signals."""
    stmt = select(TradingSignal).where(TradingSignal.status == "ACTIVE").order_by(TradingSignal.created_at.desc())
    result = await db.execute(stmt)
    signals = result.scalars().all()
    
    # In real app, join with SignalSource
    return [
        SignalResponse(
            id=s.id,
            source_name="AI Signal Bot",
            symbol=s.symbol,
            action=s.action.value if hasattr(s.action, 'value') else s.action,
            entry_price=s.entry_price,
            target_price=s.target_price,
            stop_loss=s.stop_loss,
            accuracy_percent=s.accuracy,
            status=s.status,
            created_at=s.created_at
        ) for s in signals
    ]

@router.get("/sources", response_model=List[SignalSourceResponse])
async def get_signal_sources(db: AsyncSession = Depends(get_db)):
    """Get all signal providing sources."""
    stmt = select(SignalSource).where(SignalSource.is_active == True)
    result = await db.execute(stmt)
    sources = result.scalars().all()
    return [SignalSourceResponse.from_orm(s) for s in sources]
