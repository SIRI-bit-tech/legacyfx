from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MiningPlanResponse(BaseModel):
    id: str
    name: str
    hashrate: float
    daily_earning: float
    duration_days: int
    price: float
    status: str

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
