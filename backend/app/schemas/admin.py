from pydantic import BaseModel, EmailStr
from datetime import datetime


class AdminProfile(BaseModel):
    id: str
    email: EmailStr
    name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminAuthResponse(BaseModel):
    access_token: str
    admin: AdminProfile


class AdminRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    admin_code: str


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminTransactionResponse(BaseModel):
    id: str
    user_id: str
    type: str
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDashboardStats(BaseModel):
    total_users: int
    active_traders: int
    total_volume_24h: float
    total_deposits: float
    pending_withdrawals: int
    support_tickets_open: int
