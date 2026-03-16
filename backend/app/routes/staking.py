from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.investment import InvestmentProduct, InvestmentPosition, InvestmentType
from app.utils.auth import get_current_user
from app.schemas.investment import InvestmentProductResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/staking", tags=["staking"])

class StakeRequest(BaseModel):
    product_id: str
    amount: float

class StakingResponse(BaseModel):
    id: str
    asset_symbol: str
    amount: float
    apy: float
    status: str
    unlock_date: Optional[datetime]
    created_at: datetime

@router.get("/products", response_model=List[InvestmentProductResponse])
async def get_staking_products(db: AsyncSession = Depends(get_db)):
    """Get all available staking products."""
    stmt = select(InvestmentProduct).where(InvestmentProduct.type == InvestmentType.STAKING, InvestmentProduct.is_active == True)
    result = await db.execute(stmt)
    products = result.scalars().all()
    return [InvestmentProductResponse.from_orm(p) for p in products]

@router.post("/stake", response_model=StakingResponse)
async def create_staking(
    request: StakeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Stake an asset into a product."""
    stmt = select(InvestmentProduct).where(
        InvestmentProduct.id == request.product_id, 
        InvestmentProduct.type == InvestmentType.STAKING,
        InvestmentProduct.is_active == True
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Staking product not found")

    # For staking, we check UserAsset instead of trading balance if it's not a USD product
    # But for this demo broker, many allow USD staking or auto-convert
    # Let's assume user stakes from their trading balance (USD converted)
    if current_user.trading_balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient trading balance")

    pos_id = str(uuid.uuid4())
    unlock_date = datetime.utcnow() + timedelta(days=product.duration_days) if product.duration_days else None
    
    new_staking = InvestmentPosition(
        id=pos_id,
        user_id=current_user.id,
        product_id=product.id,
        amount=request.amount,
        apy_at_start=product.apy,
        status="ACTIVE",
        maturity_date=unlock_date
    )
    
    current_user.trading_balance -= request.amount
    
    db.add(new_staking)
    await db.commit()
    
    return StakingResponse(
        id=pos_id,
        asset_symbol=product.asset_symbol,
        amount=request.amount,
        apy=product.apy,
        status="ACTIVE",
        unlock_date=unlock_date,
        created_at=datetime.utcnow()
    )

@router.get("/my-staking", response_model=List[StakingResponse])
async def get_my_staking(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's active staking positions."""
    stmt = select(InvestmentPosition, InvestmentProduct).join(
        InvestmentProduct, InvestmentPosition.product_id == InvestmentProduct.id
    ).where(
        InvestmentPosition.user_id == current_user.id,
        InvestmentProduct.type == InvestmentType.STAKING
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        StakingResponse(
            id=p.id,
            asset_symbol=ip.asset_symbol,
            amount=p.amount,
            apy=p.apy_at_start,
            status=p.status.value if hasattr(p.status, 'value') else p.status,
            unlock_date=p.maturity_date,
            created_at=p.started_at
        ) for p, ip in rows
    ]
