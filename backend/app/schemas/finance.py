from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SubscriptionPlanResponse(BaseModel):
    id: str
    name: str
    price: float
    features: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class UserSubscriptionResponse(BaseModel):
    id: str
    user_id: str
    plan_id: str
    status: str
    started_at: datetime
    expires_at: Optional[datetime]
    auto_renew: bool

    class Config:
        from_attributes = True
