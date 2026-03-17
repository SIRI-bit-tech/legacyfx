from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    referral_code: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    user_id: str
    expires_in: int = 900


class RegisterResponse(BaseModel):
    message: str
    user_id: str
    require_verification: bool = True


class PasswordResetRequest(BaseModel):
    email: EmailStr


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class TwoFactorSetupResponse(BaseModel):
    qr_code: str
    secret: str
    backup_codes: list[str]


class TwoFactorVerifyRequest(BaseModel):
    token: str
    code: str


class SessionInfo(BaseModel):
    user_id: str
    email: str
    created_at: datetime
    expires_at: datetime
    ip_address: str
    device_name: Optional[str] = None
