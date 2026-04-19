from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
import uuid

from app.database import get_db
from app.models.user import User, UserStatus
from app.schemas.auth import (
    RegisterRequest, RegisterResponse, LoginRequest, 
    TokenResponse, PasswordResetRequest, VerifyEmailRequest
)
from app.utils.auth import hash_password, verify_password, create_access_token, generate_otp, get_current_user
from app.utils.email import send_email, create_email_template
from app.config import get_settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
settings = get_settings()

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # Check if user already exists
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Generate verification code and referral code
    verification_code = generate_otp()
    from app.services.referral_service import ReferralService
    username = request.username or request.email.split('@')[0]
    new_referral_code = await ReferralService.generate_referral_code(username, db)
    
    # Create new user
    user_id = str(uuid.uuid4())
    new_user = User(
        id=user_id,
        email=request.email,
        username=request.username or request.email.split('@')[0],
        password_hash=hash_password(request.password),
        first_name=request.first_name,
        last_name=request.last_name,
        status=UserStatus.PENDING_VERIFICATION,
        email_verified=False,
        email_verification_token=verification_code,
        email_verification_expires_at=datetime.utcnow() + timedelta(minutes=15),
        referral_code=new_referral_code,
        referred_by=request.referral_code
    )
    
    db.add(new_user)
    await db.commit()
    
    # Process referral signup if referral code provided
    if request.referral_code:
        try:
            from app.utils.ably import get_ably_client
            ably_client = get_ably_client()
            await ReferralService.process_referral_signup(
                referred_user_id=user_id,
                referral_code=request.referral_code,
                db=db,
                ably_client=ably_client
            )
        except Exception as e:
            # Log but don't fail registration if referral processing fails
            import logging
            logging.error(f"Failed to process referral signup: {e}")
    
    # Send verification email in background
    email_content = create_email_template(
        title="Email Verification",
        code=verification_code,
        message="Welcome to Legacy FX! Please use the code above to verify your email address and activate your account.",
        validity_minutes=15
    )
    background_tasks.add_task(
        send_email, 
        request.email, 
        "Verify your Legacy FX account", 
        email_content
    )
    
    return RegisterResponse(
        message="Registration successful. Please check your email for the verification code.",
        user_id=user_id,
        require_verification=True
    )

@router.post("/verify-email")
async def verify_email(
    request: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    generic_error = "Invalid or expired verification code"
    
    if (
        not user or 
        user.email_verification_token != request.code or 
        not user.email_verification_expires_at or 
        user.email_verification_expires_at < datetime.utcnow()
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=generic_error)
        
    user.email_verified = True
    user.status = UserStatus.ACTIVE
    user.email_verification_token = None
    user.email_verification_expires_at = None
    
    await db.commit()
    
    # Generate access token immediately after verification
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "message": "Email verified successfully",
        "access_token": access_token,
        "user_id": user.id
    }

@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if user.status == "SUSPENDED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=None,
        user_id=user.id,
        expires_in=settings.SESSION_TIMEOUT_MINUTES * 60
    )

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}

@router.get("/session")
async def get_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user session information"""
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user.id,
        "email": user.email,
        "username": user.username,
        "email_verified": user.email_verified,
        "two_fa_enabled": user.two_factor_enabled,
        "status": user.status,
        "last_login": user.last_login
    }

@router.post("/resend-verification-email")
async def resend_verification_email(
    request: PasswordResetRequest,  # Reusing EmailStr model
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        # Don't reveal if email exists for security
        return {"message": "If an account exists with this email, a verification code has been sent"}
    
    if user.email_verified:
        return {"message": "If an account exists with this email, a verification code has been sent"}
    
    # Generate new verification code
    verification_code = generate_otp()
    user.email_verification_token = verification_code
    await db.commit()
    
    # Send verification email in background
    email_content = create_email_template(
        title="Email Verification",
        code=verification_code,
        message="A new verification code has been requested for your Legacy FX account. Please use the code above to verify your email.",
        validity_minutes=15
    )
    background_tasks.add_task(
        send_email, 
        request.email, 
        "Verify your Legacy FX account", 
        email_content
    )
    
    return {"message": "Verification code has been sent to your email"}

@router.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    return {"message": "If an account exists with this email, a reset link has been sent"}
