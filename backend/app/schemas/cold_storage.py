from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ColdStorageTransactionType(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"


class VaultAssetResponse(BaseModel):
    asset_symbol: str
    balance: float
    usd_value: float


class ColdStorageVaultResponse(BaseModel):
    id: str
    user_id: str
    total_balance_usd: float
    is_locked: bool
    last_withdrawal_at: Optional[datetime]
    created_at: datetime
    assets: List[VaultAssetResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class DepositToColdStorageRequest(BaseModel):
    asset_symbol: str
    amount: float = Field(gt=0, description="Amount must be greater than 0")


class DepositToColdStorageResponse(BaseModel):
    success: bool
    message: str
    vault_id: str
    new_vault_balance: float
    transaction_id: str


class WithdrawFromColdStorageRequest(BaseModel):
    asset_symbol: str
    amount: float = Field(gt=0, description="Amount must be greater than 0")


class WithdrawFromColdStorageResponse(BaseModel):
    success: bool
    message: str
    remaining_vault_balance: float
    transaction_id: str


class ToggleColdStorageLockRequest(BaseModel):
    is_locked: bool


class ToggleColdStorageLockResponse(BaseModel):
    success: bool
    is_locked: bool
    message: str


class ColdStorageTransactionResponse(BaseModel):
    id: str
    transaction_type: str
    asset_symbol: str
    amount: float
    usd_amount: Optional[float]
    vault_balance_after: float
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedColdStorageTransactionsResponse(BaseModel):
    transactions: List[ColdStorageTransactionResponse]
    total: int
    page: int
    limit: int
    total_pages: int
