import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user
from app.utils.tier_auth import require_elite_or_higher

logger = logging.getLogger(__name__)

from app.services.cold_storage_service import (
    ColdStorageService,
    ColdStorageError,
    VaultLockedError,
    InsufficientBalanceError,
    VaultNotFoundError
)
from app.services.ably_service import ably_service
from app.schemas.cold_storage import (
    ColdStorageVaultResponse,
    DepositToColdStorageRequest,
    DepositToColdStorageResponse,
    WithdrawFromColdStorageRequest,
    WithdrawFromColdStorageResponse,
    ToggleColdStorageLockRequest,
    ToggleColdStorageLockResponse,
    PaginatedColdStorageTransactionsResponse
)

router = APIRouter(prefix="/api/v1/cold-storage", tags=["cold-storage"])


@router.get("/vault", response_model=ColdStorageVaultResponse)
async def get_vault(
    current_user: Annotated[User, Depends(require_elite_or_higher)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get user's cold storage vault data."""
    try:
        vault_data = await ColdStorageService.get_vault_data(str(current_user.id), db)
        return ColdStorageVaultResponse(**vault_data)
    except Exception as e:
        logger.error(f"Error retrieving vault data for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve vault data")


@router.post("/deposit", response_model=DepositToColdStorageResponse)
async def deposit_to_vault(
    request: DepositToColdStorageRequest,
    current_user: Annotated[User, Depends(require_elite_or_higher)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Move funds from trading account to cold storage."""
    try:
        result = await ColdStorageService.deposit_to_vault(
            str(current_user.id),
            request.asset_symbol.upper(),
            request.amount,
            db,
            ably_service
        )
        return DepositToColdStorageResponse(**result)
    except InsufficientBalanceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ColdStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error depositing to vault for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to deposit to vault")


@router.post("/withdraw", response_model=WithdrawFromColdStorageResponse)
async def withdraw_from_vault(
    request: WithdrawFromColdStorageRequest,
    current_user: Annotated[User, Depends(require_elite_or_higher)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Move funds from cold storage to trading account."""
    try:
        result = await ColdStorageService.withdraw_from_vault(
            str(current_user.id),
            request.asset_symbol.upper(),
            request.amount,
            db,
            ably_service
        )
        return WithdrawFromColdStorageResponse(**result)
    except VaultLockedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except InsufficientBalanceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ColdStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error withdrawing from vault for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to withdraw from vault")


@router.post("/toggle-lock", response_model=ToggleColdStorageLockResponse)
async def toggle_vault_lock(
    request: ToggleColdStorageLockRequest,
    current_user: Annotated[User, Depends(require_elite_or_higher)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Toggle vault lock status."""
    try:
        result = await ColdStorageService.toggle_vault_lock(
            str(current_user.id),
            request.is_locked,
            db
        )
        return ToggleColdStorageLockResponse(**result)
    except ColdStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error toggling lock for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to toggle lock")


@router.get(
    "/transactions",
    response_model=PaginatedColdStorageTransactionsResponse
)
async def get_transactions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    """Get cold storage transaction history."""
    try:
        transactions, total = await ColdStorageService.get_vault_transactions(
            str(current_user.id),
            page,
            limit,
            db
        )
        total_pages = (total + limit - 1) // limit

        return PaginatedColdStorageTransactionsResponse(
            transactions=transactions,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    except Exception as e:
        logger.error(f"Error retrieving transactions for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve transaction history")
