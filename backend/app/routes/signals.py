from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update, and_
from typing import List, Optional, Dict, Any, Annotated
from datetime import datetime, timezone

from app.database import get_db
from app.models.signals import Signal, SignalHistory, CopiedSignal, CopyStatus, AssetType, SignalType, SignalStrength, SignalOutcome
from app.models.admin import Admin
from app.utils.auth import get_current_user
from app.utils.admin_auth import get_current_admin
from app.utils.tier_auth import require_legacy_master
from app.schemas.signals import SignalResponse, SignalStats, SignalHistoryResponse, CopiedSignalResponse, CopySignalRequest
from app.services.signals_service import SignalsService

router = APIRouter(prefix="/api/v1/signals", tags=["Signals"])

# Simple lock to prevent multiple refreshes
_is_refreshing = False

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
    
    # Convert SQLAlchemy models to Pydantic responses
    signals_data = [SignalResponse.model_validate(s) for s in paginated]
    
    return {
        "signals": signals_data,
        "stats": stats,
        "total": len(signals),
        "page": page
    }

@router.post("/refresh", response_model=Dict[str, Any])
async def refresh_signals(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[Admin, Depends(get_current_admin)]
):
    """Manually refresh signals from Twelve Data API. Saves results to DB. Admin only."""
    global _is_refreshing
    if _is_refreshing:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="A refresh is already in progress. Please wait."
        )
    
    try:
        _is_refreshing = True
        result = await SignalsService.refresh_all_signals(db)
        return {
            "success": True,
            "message": f"Signal refresh complete: {result['created']} created, {result['skipped']} skipped, {result['errors']} errors",
            **result
        }
    finally:
        _is_refreshing = False

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
    if asset_type:
        stmt = stmt.where(SignalHistory.asset_type == asset_type)
    if signal_type:
        stmt = stmt.where(SignalHistory.signal_type == signal_type)
    if outcome:
        stmt = stmt.where(SignalHistory.outcome == outcome)
    
    start = (page - 1) * limit
    stmt = stmt.offset(start).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/copied", response_model=List[CopiedSignalResponse])
async def get_user_copied_signals(
    current_user: Annotated[Any, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get all signals copied by the current user."""
    stmt = select(CopiedSignal).where(CopiedSignal.user_id == current_user.id).order_by(CopiedSignal.copied_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.delete("/copied/{copied_signal_id}", responses={404: {"description": "Copied signal not found"}})
async def cancel_copied_signal(
    copied_signal_id: str,
    current_user: Annotated[Any, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    stmt = update(CopiedSignal).where(
        and_(CopiedSignal.id == copied_signal_id, CopiedSignal.user_id == current_user.id)
    ).values(
        status=CopyStatus.CANCELLED,
        closed_at=datetime.now(timezone.utc)
    )
    result = await db.execute(stmt)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Copied signal not found")
        
    await db.commit()
    return {"success": True}

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
    current_user: Annotated[Any, Depends(require_legacy_master)],
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

