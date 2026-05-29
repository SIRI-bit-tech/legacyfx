from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    country: Optional[str]
    profile_picture_url: Optional[str]
    kyc_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    bio: Optional[str] = None


class UserSecurityResponse(BaseModel):
    two_factor_enabled: bool
    password_changed_at: Optional[datetime]
    trusted_devices: int
    active_sessions: int

    class Config:
        from_attributes = True
