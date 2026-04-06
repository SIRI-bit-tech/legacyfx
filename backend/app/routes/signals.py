from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from typing import List, Optional, Dict, Any, Annotated
from datetime import datetime

from app.database import get_db
from app.models.signals import Signal, SignalHistory, CopiedSignal, AssetType, SignalType, SignalStrength, SignalOutcome
from app.utils.auth import get_current_user
from app.schemas.signals import SignalResponse, SignalStats, SignalHistoryResponse, CopiedSignalResponse, CopySignalRequest
from app.services.signals_service import SignalsService

router = APIRouter(prefix="/api/v1/signals", tags=["Signals"])

@router.get("/", response_model=Dict[str, Any])
async def get_signals(
    asset_type: Optional[str] = None,
    signal_type: Optional[str] = None,
    strength: Optional[str] = None,
    timeframe: Optional[str] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=50)] = 8,
    db: Annotated[AsyncSession, Depends(get_db)] = None
):
    """Fetch active trading signals from database (fast, no API calls)."""
    filters = {
        "asset_type": asset_type,
        "signal_type": signal_type,
        "strength": strength,
        "timeframe": timeframe
    }
    signals = await SignalsService.get_active_signals(db, filters)
    stats = await SignalsService.get_stats(db)
    
    # Simple pagination
    start = (page - 1) * limit
    end = start + limit
    paginated = signals[start:end]
    
    # Convert SQLAlchemy models to dicts for JSON serialization
    signals_data = []
    for s in paginated:
        signals_data.append({
            "id": s.id,
            "symbol": s.symbol,
            "asset_type": s.asset_type.value if hasattr(s.asset_type, 'value') else s.asset_type,
            "signal_type": s.signal_type.value if hasattr(s.signal_type, 'value') else s.signal_type,
            "strength": s.strength.value if hasattr(s.strength, 'value') else s.strength,
            "timeframe": s.timeframe,
            "entry_price": float(s.entry_price) if s.entry_price else 0,
            "take_profit": float(s.take_profit) if s.take_profit else 0,
            "stop_loss": float(s.stop_loss) if s.stop_loss else 0,
            "rsi": float(s.rsi) if s.rsi else None,
            "macd": s.macd,
            "ema_signal": s.ema_signal,
            "bb_signal": s.bb_signal,
            "sma_signal": s.sma_signal,
            "is_active": s.is_active,
            "generated_at": s.generated_at.isoformat() if s.generated_at else None,
            "expires_at": s.expires_at.isoformat() if s.expires_at else None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    
    return {
        "signals": signals_data,
        "stats": stats,
        "total": len(signals),
        "page": page
    }

@router.post("/refresh", response_model=Dict[str, Any])
async def refresh_signals(
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Manually refresh signals from Twelve Data API. Saves results to DB."""
    result = await SignalsService.refresh_all_signals(db)
    return {
        "success": True,
        "message": f"Signal refresh complete: {result['created']} created, {result['skipped']} skipped, {result['errors']} errors",
        **result
    }

@router.get("/stats", response_model=SignalStats)
async def get_signal_stats(db: Annotated[AsyncSession, Depends(get_db)]):
    """Get overall signal performance statistics."""
    return await SignalsService.get_stats(db)

@router.get("/history", response_model=List[SignalHistoryResponse])
async def get_signal_history(
    asset_type: Optional[AssetType] = None,
    signal_type: Optional[SignalType] = None,
    outcome: Optional[SignalOutcome] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    db: Annotated[AsyncSession, Depends(get_db)] = None
):
    """Get paginated signal history."""
    stmt = select(SignalHistory).order_by(SignalHistory.generated_at.desc())
    if asset_type: stmt = stmt.where(SignalHistory.asset_type == asset_type)
    if signal_type: stmt = stmt.where(SignalHistory.signal_type == signal_type)
    if outcome: stmt = stmt.where(SignalHistory.outcome == outcome)
    
    start = (page - 1) * limit
    stmt = stmt.offset(start).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{signal_id}", response_model=SignalResponse, responses={404: {"description": "Signal not found"}})
async def get_signal_detail(
    signal_id: str,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get details for a specific signal."""
    stmt = select(Signal).where(Signal.id == signal_id)
    result = await db.execute(stmt)
    signal = result.scalar_one_or_none()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return signal

@router.post("/{signal_id}/copy", response_model=Dict[str, Any], responses={404: {"description": "Signal not found"}})
async def copy_signal(
    signal_id: str,
    req: CopySignalRequest,
    current_user: Annotated[Any, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Copy a signal to user profile with optional trade redirect."""
    copy = await SignalsService.copy_signal(current_user.id, signal_id, db)
    if not copy:
        raise HTTPException(status_code=404, detail="Signal not found")
        
    trade_url = None
    if req.open_trade_now:
        trade_url = f"/trade?symbol={copy.symbol}&entry={copy.entry_price}&tp={copy.take_profit}&sl={copy.stop_loss}"
    
    return {
        "success": True,
        "copied_signal": copy,
        "trade_url": trade_url
    }

@router.get("/copied", response_model=List[CopiedSignalResponse])
async def get_user_copied_signals(
    current_user: Annotated[Any, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get all signals copied by the current user."""
    stmt = select(CopiedSignal).where(CopiedSignal.user_id == current_user.id).order_by(CopiedSignal.copied_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.delete("/copied/{copied_signal_id}")
async def cancel_copied_signal(
    copied_signal_id: str,
    current_user: Annotated[Any, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Cancel a previously copied signal."""
    stmt = delete(CopiedSignal).where(
        and_(CopiedSignal.id == copied_signal_id, CopiedSignal.user_id == current_user.id)
    )
    await db.execute(stmt)
    await db.commit()
    return {"success": True}
