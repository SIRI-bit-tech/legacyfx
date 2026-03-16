from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReferralCodeResponse(BaseModel):
    code: str
    url: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReferralStatsResponse(BaseModel):
    total_referrals: int
    total_earnings: float
    pending_earnings: float
    active_referrals: int


class ReferralHistoryResponse(BaseModel):
    id: str
    referred_user_id: str
    commission_amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    total_earnings: float
    referral_count: int
