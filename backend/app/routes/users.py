from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
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
    date_of_birth: Optional[datetime]
    country: Optional[str]
    account_type: str
    profile_picture_url: Optional[str]
    tier: str
    kyc_status: str
    account_balance: float
    trading_balance: float
    cold_storage_balance: float
    referral_code: str
    
    # Trading Preferences
    default_order_type: str
    default_lot_size: float
    default_leverage: int
    confirmation_dialogs: bool
    one_click_trading: bool
    slippage_tolerance: float
    two_fa_enabled: bool
    tax_residency: Optional[str]
    data_sharing_enabled: bool

class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    country: Optional[str] = None
    account_type: Optional[str] = None
    profile_picture_url: Optional[str] = None
    
    # Trading Preferences
    default_order_type: Optional[str] = None
    default_lot_size: Optional[float] = None
    default_leverage: Optional[int] = None
    confirmation_dialogs: Optional[bool] = None
    one_click_trading: Optional[bool] = None
    slippage_tolerance: Optional[float] = None
    
    # Legal & Compliance
    tax_residency: Optional[str] = None
    data_sharing_enabled: Optional[bool] = None

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        date_of_birth=current_user.date_of_birth,
        country=current_user.country,
        account_type=current_user.account_type.value if hasattr(current_user.account_type, 'value') else current_user.account_type,
        profile_picture_url=current_user.profile_picture_url,
        tier=current_user.tier.value if hasattr(current_user.tier, 'value') else current_user.tier,
        kyc_status=current_user.kyc_status.value if hasattr(current_user.kyc_status, 'value') else current_user.kyc_status,
        account_balance=current_user.account_balance,
        trading_balance=current_user.trading_balance,
        cold_storage_balance=current_user.cold_storage_balance,
        referral_code=current_user.referral_code,
        # Trading Preferences
        default_order_type=current_user.default_order_type,
        default_lot_size=current_user.default_lot_size,
        default_leverage=current_user.default_leverage,
        confirmation_dialogs=current_user.confirmation_dialogs,
        one_click_trading=current_user.one_click_trading,
        slippage_tolerance=current_user.slippage_tolerance,
        two_fa_enabled=current_user.two_fa_enabled,
        tax_residency=current_user.tax_residency,
        data_sharing_enabled=current_user.data_sharing_enabled
    )

@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if request.username is not None:
        current_user.username = request.username
    if request.first_name is not None:
        current_user.first_name = request.first_name
    if request.last_name is not None:
        current_user.last_name = request.last_name
    if request.phone is not None:
        current_user.phone = request.phone
    if request.date_of_birth is not None:
        current_user.date_of_birth = request.date_of_birth
    if request.country is not None:
        current_user.country = request.country
    if request.account_type is not None:
        current_user.account_type = request.account_type
    if request.profile_picture_url is not None:
        current_user.profile_picture_url = request.profile_picture_url
    
    # Update Trading Preferences
    if request.default_order_type is not None:
        current_user.default_order_type = request.default_order_type
    if request.default_lot_size is not None:
        current_user.default_lot_size = request.default_lot_size
    if request.default_leverage is not None:
        current_user.default_leverage = request.default_leverage
    if request.confirmation_dialogs is not None:
        current_user.confirmation_dialogs = request.confirmation_dialogs
    if request.one_click_trading is not None:
        current_user.one_click_trading = request.one_click_trading
    if request.slippage_tolerance is not None:
        current_user.slippage_tolerance = request.slippage_tolerance

    # Update Legal & Compliance
    if request.tax_residency is not None:
        current_user.tax_residency = request.tax_residency
    if request.data_sharing_enabled is not None:
        current_user.data_sharing_enabled = request.data_sharing_enabled
        
    await db.commit()
    await db.refresh(current_user)
    return await get_profile(current_user)

class KYCUploadRequest(BaseModel):
    document_type: DocumentType
    file_url: str

@router.post("/kyc/upload")
async def upload_kyc(
    request: KYCUploadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import uuid
    # Check if a document of this type already exists for the user
    stmt = select(Document).where(
        Document.user_id == current_user.id,
        Document.document_type == request.document_type,
        Document.is_verified == "PENDING"
    )
    result = await db.execute(stmt)
    existing_doc = result.scalar_one_or_none()
    
    if existing_doc:
        existing_doc.cloudinary_url = request.file_url
        existing_doc.uploaded_at = datetime.utcnow()
    else:
        new_doc = Document(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            document_type=request.document_type,
            cloudinary_url=request.file_url,
            is_verified="PENDING"
        )
        db.add(new_doc)
        
    await db.commit()
    return {"message": f"{request.document_type} uploaded successfully"}

@router.post("/kyc/submit")
async def submit_kyc(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check for required documents
    stmt = select(Document).where(Document.user_id == current_user.id)
    result = await db.execute(stmt)
    docs = result.scalars().all()
    
    doc_types = [d.document_type for d in docs]
    
    has_id = any(t in ["PASSPORT", "ID_CARD", "DRIVERS_LICENSE"] for t in doc_types)
    has_address = any(t in ["PROOF_OF_ADDRESS", "BANK_STATEMENT"] for t in doc_types)
    has_business_license = "BUSINESS_LICENSE" in doc_types
    has_articles = "ARTICLES_OF_ASSOCIATION" in doc_types
    has_joint_agreement = "JOINT_OWNERSHIP_AGREEMENT" in doc_types

    # Requirement validation based on account type
    if current_user.account_type == "INDIVIDUAL":
        if not has_id or not has_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Individual accounts require a Government ID and Proof of Address."
            )
    elif current_user.account_type == "JOINT":
        if not has_id or not has_address or not has_joint_agreement:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Joint accounts require Government ID, Proof of Address, and a Joint Ownership Agreement."
            )
    elif current_user.account_type == "CORPORATE":
        if not has_business_license or not has_articles or not has_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Corporate accounts require a Business License, Articles of Association, and Proof of Address."
            )
        
    current_user.kyc_status = KYCStatus.PENDING
    await db.commit()
    
    return {"message": "KYC submitted for verification", "status": "PENDING"}

@router.get("/kyc/status")
async def get_kyc_status(current_user: User = Depends(get_current_user)):
    return {
        "status": current_user.kyc_status.value if hasattr(current_user.kyc_status, 'value') else current_user.kyc_status,
        "rejection_reason": current_user.kyc_rejection_reason
    }

@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Permanently delete the user account and all associated data.
    This is a destructive action and cannot be undone.
    """
    try:
        # The User model has cascades for most relationships, 
        # so deleting the user object will delete associated records.
        await db.delete(current_user)
        await db.commit()
        return {"message": "Account deleted successfully"}
    except Exception as e:
        await db.rollback()
        import logging
        logging.error(f"Failed to delete account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account. Please contact support."
        )
