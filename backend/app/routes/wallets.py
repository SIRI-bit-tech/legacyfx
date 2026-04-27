from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.wallet import Wallet, WalletType
from app.schemas.wallet import WalletResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/v1/wallets", tags=["wallets"])


@router.post("/connect")
async def connect_wallet(
    address: str,
    asset_symbol: str,
    wallet_type: str = "CRYPTO",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Connect a new wallet for the current user."""
    
    # Validate wallet type
    try:
        wallet_type_enum = WalletType(wallet_type.upper())
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid wallet type. Must be one of: {[wt.value for wt in WalletType]}"
        )
    
    # Check if wallet address already exists
    existing_stmt = select(Wallet).where(
        Wallet.address == address.strip(),
        Wallet.user_id == current_user.id
    )
    existing_result = await db.execute(existing_stmt)
    existing_wallet = existing_result.scalar_one_or_none()
    
    if existing_wallet:
        raise HTTPException(
            status_code=400, 
            detail="This wallet address is already connected to your account"
        )
    
    # Create new wallet
    new_wallet = Wallet(
        id=f"wallet_{datetime.utcnow().timestamp()}_{current_user.id}",
        user_id=current_user.id,
        wallet_type=wallet_type_enum,
        asset_symbol=asset_symbol.upper(),
        address=address.strip(),
        balance=0.0,
        is_active=True
    )
    
    db.add(new_wallet)
    await db.commit()
    await db.refresh(new_wallet)
    
    return {
        "message": "Wallet connected successfully",
        "wallet": {
            "id": new_wallet.id,
            "currency": new_wallet.asset_symbol,
            "address": new_wallet.address,
            "type": new_wallet.wallet_type.value,
            "balance": new_wallet.balance,
            "created_at": new_wallet.created_at
        }
    }


@router.get("/connected", response_model=List[WalletResponse])
async def get_connected_wallets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all connected wallets for the current user."""
    
    stmt = select(Wallet).where(
        Wallet.user_id == current_user.id,
        Wallet.is_active == True
    ).order_by(Wallet.created_at.desc())
    
    result = await db.execute(stmt)
    wallets = result.scalars().all()
    
    return [
        WalletResponse(
            id=wallet.id,
            currency=wallet.asset_symbol,
            balance=wallet.balance,
            address=wallet.address,
            type=wallet.wallet_type.value,
            created_at=wallet.created_at
        )
        for wallet in wallets
    ]


@router.get("/", response_model=List[WalletResponse])
async def list_wallets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all wallets for the current user (alias for /connected)."""
    return await get_connected_wallets(current_user, db)


@router.delete("/{wallet_id}")
async def disconnect_wallet(
    wallet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Disconnect/remove a wallet."""
    
    stmt = select(Wallet).where(
        Wallet.id == wallet_id,
        Wallet.user_id == current_user.id
    )
    result = await db.execute(stmt)
    wallet = result.scalar_one_or_none()
    
    if not wallet:
        raise HTTPException(
            status_code=404, 
            detail="Wallet not found"
        )
    
    # Soft delete by marking as inactive
    wallet.is_active = False
    await db.commit()
    
    return {"message": "Wallet disconnected successfully"}
