from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AdminUserResponse(BaseModel):
    id: str
    email: str
    username: str
    status: str
    tier: str
    created_at: datetime
    kyc_status: str

    class Config:
        from_attributes = True


class AdminTransactionResponse(BaseModel):
    id: str
    user_id: str
    type: str
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDashboardStats(BaseModel):
    total_users: int
    active_traders: int
    total_volume_24h: float
    total_deposits: float
    pending_withdrawals: int
    support_tickets_open: int
