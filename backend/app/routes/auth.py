from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
import uuid
import logging

from app.database import get_db
from app.models.user import User, UserStatus
from app.schemas.auth import (
    RegisterRequest, RegisterResponse, LoginRequest, 
    TokenResponse, PasswordResetRequest, VerifyEmailRequest,
    ChangePasswordRequest
)
from app.utils.auth import (
    hash_password, verify_password, create_access_token, 
    create_refresh_token, verify_token, generate_otp, 
    get_current_user, oauth2_scheme
)
from app.utils.email import send_email, create_email_template
from app.config import get_settings
from app.core.rate_limit import limiter

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
settings = get_settings()

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    register_data: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # Check if user already exists
    stmt = select(User).where(User.email == register_data.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    # GENERIC RESPONSE: Always return success to prevent user enumeration
    success_response = {
        "message": "Registration initiated. Please check your email for verification.",
        "user_id": "pending",
        "require_verification": True
    }

    if existing_user:
        # Log the attempt for security auditing but return success
        logger.info(f"Registration attempt for existing email: {register_data.email}")
        return success_response
    
    # Generate verification code and referral code for new user
    verification_code = generate_otp()
    from app.services.referral_service import ReferralService
    username = register_data.username or register_data.email.split('@')[0]
    new_referral_code = await ReferralService.generate_referral_code(username, db)
    
    # Create new user
    user_id = str(uuid.uuid4())
    new_user = User(
        id=user_id,
        email=register_data.email,
        username=username,
        password_hash=hash_password(register_data.password),
        first_name=register_data.first_name,
        last_name=register_data.last_name,
        phone=register_data.phone,
        date_of_birth=register_data.date_of_birth,
        account_type=register_data.account_type,
        status=UserStatus.PENDING_VERIFICATION,
        email_verified=False,
        email_verification_token=verification_code,
        email_verification_expires_at=datetime.utcnow() + timedelta(minutes=15),
        referral_code=new_referral_code
    )
    
    db.add(new_user)
    await db.commit()
    
    # Process referral signup if referral code provided
    if register_data.referral_code:
        try:
            from app.utils.ably import get_ably_client
            ably_client = get_ably_client()
            await ReferralService.process_referral_signup(
                referred_user_id=user_id,
                referral_code=register_data.referral_code,
                db=db,
                ably_client=ably_client
            )
            await db.commit()
        except Exception as e:
            logger.error(f"Failed to process referral signup: {e}")
    
    # Send verification email in background
    email_content = create_email_template(
        title="Email Verification",
        code=verification_code,
        message="Welcome to Legacy FX! Please use the code above to verify your email address and activate your account.",
        validity_minutes=15
    )
    
    background_tasks.add_task(
        send_email,
        register_data.email,
        "Verify Your Legacy FX Account",
        email_content
    )
    
    # Update response with actual ID for new users
    success_response["user_id"] = user_id
    return success_response

@router.post("/verify-email")
@limiter.limit("10/minute")
async def verify_email(
    request: Request,
    verify_data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == verify_data.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    generic_error = "Invalid or expired verification code"
    
    if (
        not user or 
        user.email_verification_token != verify_data.code or 
        not user.email_verification_expires_at or 
        user.email_verification_expires_at < datetime.utcnow()
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=generic_error)
        
    user.email_verified = True
    user.status = UserStatus.ACTIVE
    user.email_verification_token = None
    user.email_verification_expires_at = None
    
    await db.commit()
    
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "message": "Email verified successfully",
        "access_token": access_token,
        "user_id": user.id
    }

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == login_data.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if user.status == "SUSPENDED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended"
        )
    
    user.last_login = datetime.utcnow()
    await record_login(user.id, request, db)
    await db.commit()
    
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        expires_in=15 * 60 # 15 minutes in seconds
    )

@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    payload = verify_token(token)
    if payload and payload.get("jti"):
        from app.models.security import TokenBlocklist
        
        # Check if already blocklisted
        jti = payload.get("jti")
        stmt = select(TokenBlocklist).where(TokenBlocklist.jti == jti)
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            blocklist_entry = TokenBlocklist(
                id=str(uuid.uuid4()),
                jti=jti
            )
            db.add(blocklist_entry)
            await db.commit()
            
    return {"message": "Logged out successfully"}

@router.get("/session")
async def get_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user.id,
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
        "account_type": user.account_type,
        "profile_picture_url": user.profile_picture_url,
        "tier": user.tier,
        "email_verified": user.email_verified,
        "two_fa_enabled": user.two_factor_enabled,
        "status": user.status,
        "kyc_status": user.kyc_status,
        "last_login": user.last_login,
        "account_balance": user.account_balance,
        "created_at": user.created_at,
        # Trading Preferences
        "default_order_type": user.default_order_type,
        "default_lot_size": user.default_lot_size,
        "default_leverage": user.default_leverage,
        "confirmation_dialogs": user.confirmation_dialogs,
        "one_click_trading": user.one_click_trading,
        "slippage_tolerance": user.slippage_tolerance,
        # Legal & Compliance
        "tax_residency": user.tax_residency,
        "data_sharing_enabled": user.data_sharing_enabled,
        # Referral
        "referral_code": user.referral_code,
    }

@router.post("/resend-verification-email")
@limiter.limit("3/minute")
async def resend_verification_email(
    request: Request,
    resend_data: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == resend_data.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or user.email_verified:
        return {"message": "If an account exists with this email, a verification code has been sent"}
    
    verification_code = generate_otp()
    user.email_verification_token = verification_code
    await db.commit()
    
    email_content = create_email_template(
        title="Email Verification",
        code=verification_code,
        message="A new verification code has been requested for your Legacy FX account. Please use the code above to verify your email.",
        validity_minutes=15
    )
    background_tasks.add_task(
        send_email, 
        resend_data.email, 
        "Verify your Legacy FX account", 
        email_content
    )
    
    return {"message": "Verification code has been sent to your email"}

@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    reset_data: PasswordResetRequest
):
    return {"message": "If an account exists with this email, a reset link has been sent"}

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password")
    
    current_user.password_hash = hash_password(request.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}

@router.get("/2fa/setup")
async def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import pyotp
    import qrcode
    import io
    import base64
    
    secret = pyotp.random_base32()
    current_user.two_factor_secret = secret
    await db.commit()
    
    otp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email, 
        issuer_name="Legacy FX"
    )
    
    img = qrcode.make(otp_uri)
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    # Generate backup codes
    backup_codes = [str(uuid.uuid4())[:8] for _ in range(5)]
    import json
    current_user.backup_codes = json.dumps(backup_codes)
    await db.commit()
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{img_str}",
        "backup_codes": backup_codes
    }

@router.post("/2fa/enable")
async def enable_2fa(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import pyotp
    code = request.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")
        
    totp = pyotp.TOTP(current_user.two_factor_secret)
    if totp.verify(code):
        current_user.two_factor_enabled = True
        await db.commit()
        return {"message": "2FA enabled successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")

@router.post("/2fa/disable")
async def disable_2fa(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # For security, require password to disable 2FA
    password = request.get("password")
    if not password or not verify_password(password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid password")
        
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    current_user.backup_codes = None
    await db.commit()
    return {"message": "2FA disabled successfully"}

@router.get("/login-history")
async def get_login_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.security import LoginHistory
    stmt = select(LoginHistory).where(LoginHistory.user_id == current_user.id).order_by(LoginHistory.login_timestamp.desc()).limit(10)
    result = await db.execute(stmt)
    history = result.scalars().all()
    return history

@router.get("/trusted-devices")
async def get_trusted_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.security import TrustedDevice
    stmt = select(TrustedDevice).where(TrustedDevice.user_id == current_user.id, TrustedDevice.is_trusted == True)
    result = await db.execute(stmt)
    devices = result.scalars().all()
    return devices

@router.delete("/trusted-devices/{device_id}")
async def remove_trusted_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.security import TrustedDevice
    stmt = select(TrustedDevice).where(TrustedDevice.id == device_id, TrustedDevice.user_id == current_user.id)
    result = await db.execute(stmt)
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
        
    device.is_trusted = False
    await db.commit()
    return {"message": "Device removed successfully"}

async def record_login(user_id: str, request: Request, db: AsyncSession):
    from app.models.security import LoginHistory
    import uuid
    
    client_host = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    login_entry = LoginHistory(
        id=str(uuid.uuid4()),
        user_id=user_id,
        ip_address=client_host,
        user_agent=user_agent,
        login_timestamp=datetime.utcnow()
    )
    db.add(login_entry)
    await db.commit()

