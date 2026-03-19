from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MiningPlanResponse(BaseModel):
    id: str
    name: str
    coin_symbol: str
    hashrate: str
    daily_earnings: float
    daily_usd_profit: Optional[float] = None
    total_coin_profit: Optional[float] = None
    total_usd_profit: Optional[float] = None
    roi_percentage: Optional[float] = None
    current_price: Optional[float] = None
    duration_days: float
    price: float
    is_active: bool

    class Config:
        from_attributes = True


class MiningSubscriptionCreate(BaseModel):
    plan_id: str


class MiningSubscriptionResponse(BaseModel):
    id: str
    plan_id: str
    status: str
    started_at: datetime
    expires_at: datetime
    total_earned: float

    class Config:
        from_attributes = True


class MiningEarningsResponse(BaseModel):
    id: str
    subscription_id: str
    amount: float
    earned_at: datetime

    class Config:
        from_attributes = True
