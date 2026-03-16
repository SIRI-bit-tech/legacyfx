from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProfileResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    country: Optional[str]
    avatar_url: Optional[str]
    kyc_status: str
    created_at: datetime

class UpdateProfileRequest(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    country: Optional[str]

class SecuritySettingsResponse(BaseModel):
    is_2fa_enabled: bool
    is_email_verified: bool
    password_last_changed: datetime
    login_history_count: int

class LoginHistoryResponse(BaseModel):
    id: str
    ip_address: str
    user_agent: str
    login_timestamp: datetime
    logout_timestamp: Optional[datetime]
    is_suspicious: bool

class KYCStatusResponse(BaseModel):
    status: str
    documents_submitted: int
    verified_documents: int
    verification_date: Optional[datetime]

class KYCUploadResponse(BaseModel):
    id: str
    document_type: str
    status: str
    uploaded_at: datetime
