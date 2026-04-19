from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class ReferralStatsResponse(BaseModel):
    referral_code: str
    referral_link: str
    total_referred: int
    active_referred: int
    pending_referred: int
    total_earned: Decimal
    pending_commission: Decimal
    paid_commission: Decimal
    today_earned: Decimal
    this_month_earned: Decimal
    current_tier: int
    next_tier_threshold: Optional[int]
    referrals_to_next_tier: Optional[int]


class ReferredUserResponse(BaseModel):
    id: str
    email: str  # Will be masked
    joined_date: datetime
    status: str
    total_trades: int
    commission_earned: Decimal
    last_activity: Optional[datetime]

    class Config:
        from_attributes = True


class ReferredUsersListResponse(BaseModel):
    users: List[ReferredUserResponse]
    total: int
    page: int
    total_pages: int


class CommissionHistoryResponse(BaseModel):
    id: str
    source_user_email: str  # Masked
    source_type: str
    source_amount: Decimal
    commission_rate: Decimal
    commission_amount: Decimal
    status: str
    earned_at: datetime

    class Config:
        from_attributes = True


class CommissionListResponse(BaseModel):
    commissions: List[CommissionHistoryResponse]
    total: int
    page: int
    total_pages: int


class PayoutHistoryResponse(BaseModel):
    id: str
    payout_date: date
    commission_count: int
    total_amount: Decimal
    status: str
    paid_at: Optional[datetime]

    class Config:
        from_attributes = True


class PayoutListResponse(BaseModel):
    payouts: List[PayoutHistoryResponse]
    total: int
    page: int
    total_pages: int


class LeaderboardEntry(BaseModel):
    rank: int
    name: str  # Masked (First name + last initial)
    total_referred: int
    joined_month: str

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    leaders: List[LeaderboardEntry]
    current_user_rank: Optional[int]
