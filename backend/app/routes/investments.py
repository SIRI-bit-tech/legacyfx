from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.investment import InvestmentProduct, InvestmentPosition, InvestmentStatus, InvestmentType
from app.utils.auth import get_current_user
from app.schemas.investment import InvestmentProductResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/investments", tags=["investments"])

class InvestRequest(BaseModel):
    product_id: str
    amount: float

class InvestmentResponse(BaseModel):
    id: str
    product_name: str
    amount: float
    apy: float
    status: str
    maturity_date: Optional[datetime]
    created_at: datetime

@router.get("/products", response_model=List[InvestmentProductResponse])
async def get_investment_products(db: AsyncSession = Depends(get_db)):
    """Get all available investment products."""
    stmt = select(InvestmentProduct).where(InvestmentProduct.is_active == True)
    result = await db.execute(stmt)
    products = result.scalars().all()
    return [InvestmentProductResponse.from_orm(p) for p in products]

@router.post("/invest", response_model=InvestmentResponse)
async def create_investment(
    request: InvestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Subscribe to an investment product."""
    # 1. Fetch product
    stmt = select(InvestmentProduct).where(InvestmentProduct.id == request.product_id, InvestmentProduct.is_active == True)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or inactive")
        
    if request.amount < product.min_investment:
        raise HTTPException(status_code=400, detail=f"Minimum investment is {product.min_investment}")

    # 2. Check balance
    # Invest from trading balance for now
    if current_user.trading_balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient trading balance")

    # 3. Create Position
    pos_id = str(uuid.uuid4())
    maturity = datetime.utcnow() + timedelta(days=product.duration_days) if product.duration_days else None
    
    new_position = InvestmentPosition(
        id=pos_id,
        user_id=current_user.id,
        product_id=product.id,
        amount=request.amount,
        apy_at_start=product.apy,
        status="ACTIVE", # Enum doesn't match string exactly in some models, using string for now
        maturity_date=maturity
    )
    
    # 4. Deduct balance
    current_user.trading_balance -= request.amount
    # Moving to 'locked' or just reducing trading balance is fine for demo
    
    db.add(new_position)
    await db.commit()
    
    return InvestmentResponse(
        id=pos_id,
        product_name=product.name,
        amount=request.amount,
        apy=product.apy,
        status="ACTIVE",
        maturity_date=maturity,
        created_at=datetime.utcnow()
    )

@router.get("/my-investments", response_model=List[InvestmentResponse])
async def get_my_investments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's active investment positions."""
    stmt = select(InvestmentPosition, InvestmentProduct).join(
        InvestmentProduct, InvestmentPosition.product_id == InvestmentProduct.id
    ).where(InvestmentPosition.user_id == current_user.id)
    
    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        InvestmentResponse(
            id=p.id,
            product_name=ip.name,
            amount=p.amount,
            apy=p.apy_at_start,
            status=p.status.value if hasattr(p.status, 'value') else p.status,
            maturity_date=p.maturity_date,
            created_at=p.started_at
        ) for p, ip in rows
    ]
