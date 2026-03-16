from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SignalResponse(BaseModel):
    id: str
    symbol: str
    type: str
    signal_type: str
    entry_price: float
    target_price: float
    stop_loss: float
    accuracy: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SignalSourceResponse(BaseModel):
    id: str
    name: str
    accuracy_percent: float
    total_trades: int
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class SignalSubscriptionCreate(BaseModel):
    signal_source_id: str


class SignalSubscriptionResponse(BaseModel):
    id: str
    signal_source_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SignalHistoryResponse(BaseModel):
    id: str
    symbol: str
    signal_type: str
    result: str
    profit_loss: float
    created_at: datetime
    closed_at: datetime

    class Config:
        from_attributes = True
