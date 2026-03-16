from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, KYCStatus
from app.models.document import Document, DocumentType
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["users"])

class UserProfileResponse(BaseModel):
    id: str
    email: str
    username: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    country: Optional[str]
    profile_picture_url: Optional[str]
    tier: str
    kyc_status: str
    account_balance: float
    trading_balance: float
    cold_storage_balance: float
    referral_code: str

class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        country=current_user.country,
        profile_picture_url=current_user.profile_picture_url,
        tier=current_user.tier.value if hasattr(current_user.tier, 'value') else current_user.tier,
        kyc_status=current_user.kyc_status.value if hasattr(current_user.kyc_status, 'value') else current_user.kyc_status,
        account_balance=current_user.account_balance,
        trading_balance=current_user.trading_balance,
        cold_storage_balance=current_user.cold_storage_balance,
        referral_code=current_user.referral_code
    )

@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if request.first_name is not None:
        current_user.first_name = request.first_name
    if request.last_name is not None:
        current_user.last_name = request.last_name
    if request.phone is not None:
        current_user.phone = request.phone
    if request.country is not None:
        current_user.country = request.country
        
    await db.commit()
    await db.refresh(current_user)
    return await get_profile(current_user)

@router.post("/kyc/upload")
async def upload_kyc(
    document_type: DocumentType,
    file_url: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import uuid
    new_doc = Document(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        document_type=document_type,
        cloudinary_url=file_url,
        is_verified="PENDING"
    )
    
    current_user.kyc_status = KYCStatus.PENDING
    db.add(new_doc)
    await db.commit()
    
    return {"message": "KYC document uploaded successfully", "status": "PENDING"}

@router.get("/kyc/status")
async def get_kyc_status(current_user: User = Depends(get_current_user)):
    return {
        "status": current_user.kyc_status.value if hasattr(current_user.kyc_status, 'value') else current_user.kyc_status,
        "rejection_reason": current_user.kyc_rejection_reason
    }
