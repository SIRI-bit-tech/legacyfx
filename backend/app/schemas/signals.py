from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from app.models.signals import AssetType, SignalType, SignalStrength, SignalOutcome, CopyStatus

class SignalBase(BaseModel):
    symbol: str
    asset_type: AssetType
    signal_type: SignalType
    strength: SignalStrength
    timeframe: str
    entry_price: Decimal
    take_profit: Decimal
    stop_loss: Decimal

class SignalResponse(SignalBase):
    id: str
    rsi: Optional[Decimal] = None
    macd: Optional[str] = None
    ema_signal: Optional[str] = None
    bb_signal: Optional[str] = None
    sma_signal: Optional[str] = None
    indicators_raw: Optional[Dict[str, Any]] = None
    is_active: bool
    generated_at: datetime
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SignalStats(BaseModel):
    total_active: int
    overall_accuracy: Decimal
    buy_count: int
    buy_accuracy: Decimal
    sell_count: int
    sell_accuracy: Decimal
    last_updated: Optional[datetime] = None

class SignalHistoryResponse(BaseModel):
    id: str
    signal_id: str
    symbol: str
    asset_type: AssetType
    signal_type: SignalType
    entry_price: Decimal
    take_profit: Decimal
    stop_loss: Decimal
    exit_price: Optional[Decimal] = None
    result_percent: Optional[Decimal] = None
    outcome: SignalOutcome
    timeframe: str
    generated_at: datetime
    closed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SignalAccuracyResponse(BaseModel):
    symbol: str
    asset_type: AssetType
    signal_type: SignalType
    total_signals: int
    winning_signals: int
    accuracy_percent: Decimal
    last_calculated_at: datetime

    class Config:
        from_attributes = True

class CopiedSignalResponse(BaseModel):
    id: str
    user_id: str
    signal_id: str
    symbol: str
    signal_type: SignalType
    entry_price: Decimal
    take_profit: Decimal
    stop_loss: Decimal
    status: CopyStatus
    copied_at: datetime
    closed_at: Optional[datetime] = None
    created_at: datetime
    trade_url: Optional[str] = None

    class Config:
        from_attributes = True

class CopySignalRequest(BaseModel):
    open_trade_now: bool = False
