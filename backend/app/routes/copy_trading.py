from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from datetime import datetime, timezone
import uuid
import logging

from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user
from app.schemas.copy_trading import (
    MasterTraderResponse,
    StartCopyTradingRequest,
    CopyTradeStatusResponse,
    SearchTraderRequest,
    StopCopyTradingRequest
)
from app.utils.bybit import bybit_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/copy-trading", tags=["copy-trading"])


@router.get("/master-traders", response_model=List[MasterTraderResponse])
async def get_master_traders(
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """
    Get real top performers from Bybit V5 
    """
    try:
        traders = await bybit_client.get_master_traders(limit=limit)
        return traders
    except Exception as e:
        logger.error(f"Error in get_master_traders: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to connect to trading engine"
        )


@router.post("/search-traders", response_model=List[MasterTraderResponse])
async def search_traders(
    request: SearchTraderRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Search for traders on Bybit V5 directly
    """
    if not request.query or len(request.query) < 2:
        raise HTTPException(
            status_code=400,
            detail="Search query must be at least 2 characters"
        )
    
    # We use the same fetcher which pulls the live list
    traders = await bybit_client.get_master_traders(limit=request.limit)
    filtered = [t for t in traders if request.query.lower() in t["username"].lower()]
    
    return filtered


@router.post("/start")
async def start_copy_trading(
    request: StartCopyTradingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Start following/copying a Bybit V5 trader
    """
    copy_config = {
        "copyMode": "fixed_amount" if request.copy_mode == "fixed_amount" else "multiplier",
        "fixedAmount": str(request.fixed_amount),
        "multiplier": str(request.leverage or 1.0)
    }
    
    result = await bybit_client.start_copy_trading(request.trader_id, copy_config)
    
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to start copy trading on engine")
        )
    
    return {
        "success": True,
        "message": "Copy trading activated successfully on Bybit",
        "trader_id": request.trader_id,
        "started_at": datetime.now(timezone.utc)
    }


@router.post("/stop")
async def stop_copy_trading(
    request: StopCopyTradingRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Stop following a Bybit trader
    """
    result = await bybit_client.stop_copy_trading(request.copy_id)
    
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to stop copy trading")
        )
    
    return {
        "success": True,
        "message": "Copy trading stopped and unsubscribed from Bybit trader",
        "stopped_at": datetime.now(timezone.utc)
    }


@router.get("/status/{trader_id}")
async def get_copy_status(
    trader_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get current performance of an active copy session on Bybit
    """
    status_data = await bybit_client.get_copy_trading_status(trader_id)
    if not status_data:
        raise HTTPException(status_code=404, detail="No active copy session found for this trader")
    return status_data
