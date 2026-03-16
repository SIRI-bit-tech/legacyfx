from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class StakingProductResponse(BaseModel):
    id: str
    asset: str
    apy: float
    min_amount: float
    max_amount: Optional[float]
    lock_period: int
    status: str

    class Config:
        from_attributes = True


class StakingCreate(BaseModel):
    product_id: str
    amount: float = Field(..., gt=0)


class StakingPositionResponse(BaseModel):
    id: str
    product_id: str
    asset: str
    amount: float
    apy: float
    earned: float
    status: str
    created_at: datetime
    unlock_date: datetime

    class Config:
        from_attributes = True


class RewardResponse(BaseModel):
    id: str
    position_id: str
    amount: float
    asset: str
    earned_at: datetime

    class Config:
        from_attributes = True
