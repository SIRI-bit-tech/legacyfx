from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.routes.auth import get_current_user
from app.models.user import User
from app.schemas.real_estate import PropertyFilters, ListingsResponse, UnifiedProperty, InvestRequest, InvestmentResponse, PortfolioResponse, PaginatedTransactions
from app.services.real_estate_service import RealEstateService
from app.services.ably_service import ably_service
import uuid

router = APIRouter(prefix="/api/v1/real-estate", tags=["Real Estate"])

@router.get("/listings", response_model=ListingsResponse)
async def get_listings(
    type: str = "all",
    city: Optional[str] = None,
    state: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_beds: Optional[int] = None,
    min_baths: Optional[int] = None,
    property_type: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    filters = PropertyFilters(
        type=type, city=city, state=state, 
        min_price=min_price, max_price=max_price,
        min_beds=min_beds, min_baths=min_baths,
        property_type=property_type, page=page, limit=limit
    )
    return await RealEstateService.get_listings(filters, db)

@router.get("/listings/{property_id}", response_model=UnifiedProperty)
async def get_property_detail(property_id: str, db: AsyncSession = Depends(get_db)):
    prop = await RealEstateService.get_property_by_id(property_id, db)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop

@router.get("/portfolio", response_model=PortfolioResponse)
async def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await RealEstateService.get_portfolio(str(current_user.id), db)

@router.post("/invest", response_model=InvestmentResponse)
async def invest_in_property(
    request: InvestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await RealEstateService.invest_in_property(
            str(current_user.id), request, db, ably_service
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/exit")
async def exit_investment(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    investment_id = body.get("investment_id")
    if not investment_id:
        raise HTTPException(status_code=400, detail="investment_id required")
    
    try:
        return await RealEstateService.exit_investment(
            investment_id, str(current_user.id), db, ably_service
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/transactions", response_model=PaginatedTransactions)
async def get_transactions(
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    txs, total = await RealEstateService.get_transactions(str(current_user.id), page, limit, db)
    return {
        "transactions": txs,
        "total": total,
        "page": page,
        "limit": limit
    }
