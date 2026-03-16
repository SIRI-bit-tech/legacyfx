from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class InvestmentProductResponse(BaseModel):
    id: str
    name: str
    type: str
    expected_yield: float
    min_investment: float
    duration_days: int
    status: str
    description: Optional[str]

    class Config:
        from_attributes = True


class InvestmentCreate(BaseModel):
    product_id: str
    amount: float = Field(..., gt=0)


class InvestmentPositionResponse(BaseModel):
    id: str
    product_id: str
    amount: float
    status: str
    returns: float
    returns_percentage: float
    created_at: datetime
    maturity_date: datetime

    class Config:
        from_attributes = True
