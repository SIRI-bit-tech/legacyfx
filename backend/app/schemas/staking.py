"""Pydantic schemas for Staking APIs"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from enum import Enum

class PayoutFrequency(str, Enum):
    DAILY = "DAILY"
    MONTHLY = "MONTHLY"
    END_OF_TERM = "END_OF_TERM"

class StakingType(str, Enum):
    FLEXIBLE = "FLEXIBLE"
    FIXED_30 = "FIXED_30"
    FIXED_90 = "FIXED_90"
    FIXED_180 = "FIXED_180"

# ============ REQUEST SCHEMAS ============

class StakeRequest(BaseModel):
    """Request to create new staking position"""
    pool_id: str
    amount: float = Field(gt=0, description="Amount to stake")

class ClaimRewardsRequest(BaseModel):
    """Request to claim accrued rewards"""
    position_id: Optional[str] = None  # None = claim all

class AdminPoolRequest(BaseModel):
    """Request to create new staking pool (admin)"""
    asset_symbol: str
    staking_type: StakingType
    annual_percentage_yield: float = Field(gt=0, description="APY percentage (e.g., 12.5 for 12.5%)")
    min_stake_amount: float = Field(ge=0, description="Minimum stake amount")
    lock_period_days: int = Field(ge=0, description="Lock period in days (0 for flexible)")
    payout_frequency: PayoutFrequency
    pool_capacity_amount: float = Field(gt=0, description="Maximum total stakeable amount")

class AdminPoolUpdateRequest(BaseModel):
    """Request to update staking pool (admin)"""
    annual_percentage_yield: Optional[float] = Field(None, gt=0)
    min_stake_amount: Optional[float] = Field(None, ge=0)
    pool_capacity_amount: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None
    payout_frequency: Optional[PayoutFrequency] = None


# ============ RESPONSE SCHEMAS ============

class StakingPoolResponse(BaseModel):
    """Response for staking pool"""
    id: str
    asset_symbol: str
    staking_type: StakingType
    annual_percentage_yield: float
    min_stake_amount: float
    lock_period_days: Optional[int]
    payout_frequency: PayoutFrequency
    pool_capacity_amount: Optional[float]
    current_total_staked: float
    available_capacity_pct: Optional[float] = None  # Calculated
    total_users_staking: Optional[int] = None  # Calculated
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class StakingRewardResponse(BaseModel):
    """Individual reward record"""
    id: str
    amount: float
    earned_on_date: datetime
    paid_on_date: Optional[datetime]
    status: str
    reward_type: str
    
    class Config:
        from_attributes = True

class StakingPositionResponse(BaseModel):
    """Response for user's staking position"""
    id: str
    pool_id: str
    asset_symbol: str
    amount_staked: float
    total_earned_amount: float
    earned_so_far: Optional[float] = None  # Calculated from rewards
    next_payout_date: Optional[datetime] = None  # Calculated
    annual_earning_rate: Optional[float] = None  # Calculated (amount * apy / 365)
    status: str
    is_active: bool
    is_locked: Optional[bool] = None  # Calculated (true if fixed term)
    started_at: datetime
    earned_until_date: Optional[datetime]
    
    class Config:
        from_attributes = True

class StakingStatsResponse(BaseModel):
    """User's overall staking statistics"""
    total_staked_usd: float
    total_earned_usd: float
    avg_apy: float
    claimable_now: float
    active_stakes_count: int
    next_payout_date: Optional[datetime]
    annual_projected_earnings: float
    earned_today: float
    earned_this_month: float

class StakingScheduleResponse(BaseModel):
    """Upcoming reward payout schedule"""
    position_id: str
    asset: str
    next_payout_date: datetime
    expected_amount: float
    frequency: PayoutFrequency

class StakingOperationResponse(BaseModel):
    """Response for operations (stake, unstake, claim)"""
    success: bool
    message: str
    data: Optional[dict] = None
