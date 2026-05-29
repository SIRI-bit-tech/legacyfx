from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.staking import StakingType
from app.schemas.staking import (
    StakingPoolResponse,
    StakingPositionResponse,
    StakingStatsResponse,
    StakingRewardResponse,
    StakingScheduleResponse,
    StakingOperationResponse,
    StakeRequest,
    ClaimRewardsRequest,
    AdminPoolRequest,
    AdminPoolUpdateRequest
)
from app.services.staking_service import StakingService
from app.utils.auth import get_current_user, is_admin
from app.utils.tier_auth import require_elite_or_higher
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/staking", tags=["staking"])


# ============================================================================
# PUBLIC ENDPOINTS (All Users - Pool Browsing & Staking Operations)
# ============================================================================

@router.get("/pools", response_model=List[StakingPoolResponse])
@router.get("/products", response_model=List[StakingPoolResponse], include_in_schema=False)
async def list_staking_pools(
    staking_type: Optional[StakingType] = Query(None, description="Filter by staking type (FLEXIBLE, FIXED_30, FIXED_90, FIXED_180)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all available staking pools.
    
    Optional query params:
    - staking_type: Filter pools by type (FLEXIBLE/FIXED_30/FIXED_90/FIXED_180)
    """
    try:
        pools = await StakingService.get_all_pools(db, filter_type=staking_type)
        return pools
    except Exception as e:
        logger.error(f"Error fetching staking pools: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch staking pools")


@router.get("/pools/{pool_id}", response_model=StakingPoolResponse)
async def get_staking_pool(
    pool_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get details of a specific staking pool."""
    try:
        pool = await StakingService.get_pool_by_id(db, pool_id)
        if not pool:
            raise HTTPException(status_code=404, detail="Staking pool not found")
        return pool
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching pool {pool_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch staking pool")


@router.post("/stakes", response_model=StakingOperationResponse)
async def create_stake(
    request: StakeRequest,
    current_user: User = Depends(require_elite_or_higher),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new staking position.
    
    Request body:
    {
        "pool_id": "uuid",
        "amount": 1000.00
    }
    """
    try:
        position_id = await StakingService.stake(
            db,
            user_id=current_user.id,
            pool_id=request.pool_id,
            amount=request.amount
        )
        return StakingOperationResponse(
            success=True,
            message=f"Successfully staked {request.amount} USDT",
            data={"position_id": position_id}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating stake for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create stake")


@router.get("/stakes", response_model=List[StakingPositionResponse])
@router.get("/my-staking", response_model=List[StakingPositionResponse], include_in_schema=False)
async def get_user_stakes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all active staking positions for current user."""
    try:
        stakes = await StakingService.get_user_stakes(db, user_id=current_user.id)
        return stakes
    except Exception as e:
        logger.error(f"Error fetching stakes for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch staking positions")


@router.delete("/stakes/{position_id}", response_model=StakingOperationResponse)
async def unstake(
    position_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Unstake from a position.
    
    Returns principal + earned rewards.
    Cannot unstake if position is locked.
    """
    try:
        amount_returned = await StakingService.unstake(
            db,
            user_id=current_user.id,
            position_id=position_id
        )
        return StakingOperationResponse(
            success=True,
            message=f"Successfully unstaked. Returned: {amount_returned} USDT",
            data={"amount_returned": amount_returned}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error unstaking {position_id} for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to unstake")


@router.get("/stats", response_model=StakingStatsResponse)
async def get_staking_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive staking statistics for current user."""
    try:
        stats = await StakingService.get_user_stats(db, user_id=current_user.id)
        return stats
    except Exception as e:
        logger.error(f"Error fetching stats for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch staking statistics")


@router.get("/rewards", response_model=List[StakingRewardResponse])
async def get_rewards_history(
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """Get reward history for current user (paginated)."""
    try:
        rewards = await StakingService.get_user_rewards_history(db, user_id=current_user.id, limit=limit)
        return rewards
    except Exception as e:
        logger.error(f"Error fetching rewards for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch reward history")


@router.post("/rewards/claim", response_model=StakingOperationResponse)
async def claim_rewards(
    request: ClaimRewardsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Claim accrued rewards.
    
    Request body:
    {
        "position_id": "uuid (optional - if not provided, claims all positions)"
    }
    
    Returns amount claimed and added to trading balance.
    """
    try:
        amount_claimed = await StakingService.claim_rewards(
            db,
            user_id=current_user.id,
            position_id=request.position_id
        )
        return StakingOperationResponse(
            success=True,
            message=f"Successfully claimed {amount_claimed} USDT in rewards",
            data={"amount_claimed": amount_claimed}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error claiming rewards for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to claim rewards")


@router.get("/schedule", response_model=List[StakingScheduleResponse])
async def get_payout_schedule(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get upcoming payout schedule for user's staking positions."""
    try:
        schedule = await StakingService.get_payout_schedule(db, user_id=current_user.id)
        return schedule
    except Exception as e:
        logger.error(f"Error fetching schedule for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payout schedule")


# ============================================================================
# ADMIN ENDPOINTS (Admin-only Pool Management)
# ============================================================================

@router.post("/admin/pools", response_model=StakingOperationResponse)
async def create_staking_pool(
    request: AdminPoolRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new staking pool (admin only).
    
    Request body:
    {
        "asset_symbol": "USDT",
        "staking_type": "FLEXIBLE",
        "annual_percentage_yield": 12.5,
        "min_stake_amount": 100.0,
        "lock_period_days": 0,
        "payout_frequency": "DAILY",
        "pool_capacity_amount": 1000000.0
    }
    """
    try:
        # Check admin status
        if not await is_admin(current_user, db):
            raise HTTPException(status_code=403, detail="Admin permission required")
        
        pool_id = await StakingService.create_pool(
            db,
            asset_symbol=request.asset_symbol,
            staking_type=request.staking_type,
            annual_percentage_yield=request.annual_percentage_yield,
            min_stake_amount=request.min_stake_amount,
            lock_period_days=request.lock_period_days,
            payout_frequency=request.payout_frequency,
            pool_capacity_amount=request.pool_capacity_amount
        )
        await db.commit()
        
        return StakingOperationResponse(
            success=True,
            message=f"Staking pool created successfully",
            data={"pool_id": pool_id}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating staking pool: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create staking pool")


@router.put("/admin/pools/{pool_id}", response_model=StakingOperationResponse)
async def update_staking_pool(
    pool_id: str,
    request: AdminPoolUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update staking pool (admin only).
    
    Request body (all fields optional):
    {
        "annual_percentage_yield": 15.0,
        "min_stake_amount": 50.0,
        "pool_capacity_amount": 2000000.0,
        "is_active": true,
        "payout_frequency": "MONTHLY"
    }
    """
    try:
        # Check admin status
        if not await is_admin(current_user, db):
            raise HTTPException(status_code=403, detail="Admin permission required")
        
        # Build update dict from request (only include provided fields)
        update_data = {}
        if request.annual_percentage_yield is not None:
            update_data['annual_percentage_yield'] = request.annual_percentage_yield
        if request.min_stake_amount is not None:
            update_data['min_stake_amount'] = request.min_stake_amount
        if request.pool_capacity_amount is not None:
            update_data['pool_capacity_amount'] = request.pool_capacity_amount
        if request.is_active is not None:
            update_data['is_active'] = request.is_active
        if request.payout_frequency is not None:
            update_data['payout_frequency'] = request.payout_frequency
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        success = await StakingService.update_pool(db, pool_id, **update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="Pool not found")
        
        await db.commit()
        
        return StakingOperationResponse(
            success=True,
            message=f"Staking pool updated successfully",
            data={"pool_id": pool_id}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating pool {pool_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update staking pool")
