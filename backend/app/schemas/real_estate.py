from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PropertyResponse(BaseModel):
    id: str
    name: str
    location: str
    description: Optional[str]
    value: float
    annual_roi: float
    tokens_issued: float
    tokens_available: float
    min_investment: float
    image_url: Optional[str]
    is_active: bool

class InvestPropertyRequest(BaseModel):
    property_id: str
    tokens_to_purchase: float

class RealEstateInvestmentResponse(BaseModel):
    id: str
    property_id: str
    property_name: str
    tokens_purchased: float
    amount_invested: float
    earnings: float
    created_at: datetime

class EarningsResponse(BaseModel):
    total_earnings: float
    monthly_earnings: float
    properties: List[RealEstateInvestmentResponse]
