from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AccountCreate(BaseModel):
    account_type: str
    name: str
    currency: str


class AccountUpdate(BaseModel):
    name: Optional[str] = None


class AccountResponse(BaseModel):
    id: str
    account_type: str
    name: str
    currency: str
    balance: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BalanceResponse(BaseModel):
    account_id: str
    balance: float
    available: float
    reserved: float
    last_updated: datetime


class TransactionResponse(BaseModel):
    id: str
    account_id: str
    type: str
    amount: float
    currency: str
    description: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
