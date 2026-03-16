from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DepositInitiate(BaseModel):
    currency: str
    network: str
    amount: Optional[float] = None


class DepositResponse(BaseModel):
    id: str
    status: str
    currency: str
    network: str
    amount: Optional[float]
    wallet_address: str
    qr_code: Optional[str]
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class WithdrawalInitiate(BaseModel):
    currency: str
    amount: float = Field(..., gt=0)
    address: str
    network: str
    label: Optional[str] = None


class WithdrawalResponse(BaseModel):
    id: str
    status: str
    currency: str
    amount: float
    fee: float
    address: str
    transaction_hash: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class WalletResponse(BaseModel):
    id: str
    currency: str
    balance: float
    address: Optional[str]
    type: str
    created_at: datetime

    class Config:
        from_attributes = True


class ColdStorageResponse(BaseModel):
    id: str
    currency: str
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
