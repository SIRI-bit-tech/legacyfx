from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import datetime, timezone
from pydantic import BaseModel
from uuid import uuid4

from app.database import get_db
from app.models.user import User
from app.models.wallet import Wallet, WalletType
from app.schemas.wallet import WalletResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/v1/wallets", tags=["wallets"])

class ConnectWalletRequest(BaseModel):
    address: str
    asset_symbol: str
    wallet_type: str = "CRYPTO"


@router.post("/connect")
async def connect_wallet(
    payload: ConnectWalletRequest = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Connect a new wallet for the current user."""
    
    # Validate wallet type
    try:
        wallet_type_enum = WalletType(payload.wallet_type.upper())
    except ValueError as err:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid wallet type. Must be one of: {[wt.value for wt in WalletType]}"
        ) from err
    
    address_original = payload.address.strip()
    address_normalized = address_original.lower()
    
    # 1. Query Wallet by address (global search using normalized address)
    stmt = select(Wallet).where(Wallet.address_normalized == address_normalized)
    result = await db.execute(stmt)
    existing_wallet = result.scalar_one_or_none()
    
    if existing_wallet:
        # 2. If found and wallet.user_id != current_user.id, return a 400
        if existing_wallet.user_id != current_user.id:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "This wallet address is already in use by another account",
                    "code": "WALLET_IN_USE"
                }
            )
        
        # 3. If found and wallet.user_id == current_user.id, check if active or reactivate
        if existing_wallet.is_active:
            raise HTTPException(
                status_code=400, 
                detail={
                    "message": "This wallet address is already connected to your account",
                    "code": "WALLET_ALREADY_CONNECTED"
                }
            )
        
        # Reactivate and update the existing soft-deleted wallet
        existing_wallet.is_active = True
        existing_wallet.wallet_type = wallet_type_enum
        existing_wallet.asset_symbol = payload.asset_symbol.upper()
        existing_wallet.address = address_original
        existing_wallet.address_normalized = address_normalized
        existing_wallet.updated_at = datetime.now(timezone.utc)
        wallet = existing_wallet
    else:
        # 4. Only insert a new Wallet when no row exists at all
        wallet = Wallet(
            id=f"wallet_{uuid4()}",
            user_id=current_user.id,
            wallet_type=wallet_type_enum,
            asset_symbol=payload.asset_symbol.upper(),
            address=address_original,
            address_normalized=address_normalized,
            balance=0.0,
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(wallet)
    
    try:
        await db.commit()
        await db.refresh(wallet)
    except IntegrityError as err:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A conflict occurred while connecting the wallet address"
        ) from err
    
    return {
        "message": "Wallet connected successfully",
        "wallet": {
            "id": wallet.id,
            "currency": wallet.asset_symbol,
            "address": wallet.address,
            "type": wallet.wallet_type.value,
            "balance": wallet.balance,
            "created_at": wallet.created_at
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
        Wallet.is_active.is_(True)
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
    wallet.updated_at = datetime.now(timezone.utc)
    await db.commit()
    
    return {"message": "Wallet disconnected successfully"}
