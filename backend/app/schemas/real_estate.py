from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from decimal import Decimal

class PropertyFilters(BaseModel):
    type: str = "all"
    city: Optional[str] = None
    state: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_beds: Optional[int] = None
    min_baths: Optional[int] = None
    property_type: Optional[str] = None
    page: int = 1
    limit: int = 20

class UnifiedProperty(BaseModel):
    id: str
    source: str
    type: str
    title: str
    address: str
    city: str
    state: str
    price: float
    price_per_month: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    area_sqft: Optional[float] = None
    images: List[str] = []
    estimated_roi: Optional[float] = None
    estimated_monthly_rent: Optional[float] = None
    property_type: Optional[str] = None
    listed_at: Optional[str] = None

class ListingsResponse(BaseModel):
    listings: List[UnifiedProperty]
    total: int
    page: int
    has_more: bool

class InvestRequest(BaseModel):
    property_id: str
    amount: float
    tokens: int

class InvestmentResponse(BaseModel):
    id: str
    status: str
    amount_invested: Decimal
    tokens_owned: int
    created_at: datetime

class PortfolioResponse(BaseModel):
    total_value: Decimal
    active_count: int
    monthly_income: Decimal
    avg_roi: Decimal
    investments: List[Dict[str, Any]]

class TransactionResponse(BaseModel):
    id: str
    type: str
    asset_name: str
    amount: Decimal
    status: str
    created_at: datetime

class PaginatedTransactions(BaseModel):
    transactions: List[TransactionResponse]
    total: int
    page: int
    limit: int
