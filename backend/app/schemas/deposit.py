from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DepositInitiateRequest(BaseModel):
    deposit_type: str
    asset_symbol: Optional[str]
    amount: float

class DepositInitiateResponse(BaseModel):
    id: str
    deposit_address: Optional[str]
    qr_code: Optional[str]
    amount_expected: float
    status: str
    created_at: datetime

class DepositHistoryResponse(BaseModel):
    id: str
    type: str
    asset_symbol: Optional[str]
    amount: float
    status: str
    transaction_hash: Optional[str]
    created_at: datetime

class DepositDetailResponse(BaseModel):
    id: str
    type: str
    amount: float
    status: str
    transaction_hash: Optional[str]
    confirmed_at: Optional[datetime]
    created_at: datetime

class AdminConfirmRequest(BaseModel):
    transaction_hash: str
