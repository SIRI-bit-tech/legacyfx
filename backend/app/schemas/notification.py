from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationPreferences(BaseModel):
    trades: bool = True
    deposits: bool = True
    withdrawals: bool = True
    staking: bool = True
    signals: bool = True
    security: bool = True
    promotions: bool = False
