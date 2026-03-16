from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import uuid

from app.database import get_db
from app.models.user import User, UserStatus
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, PasswordResetRequest
from app.utils.auth import hash_password, verify_password, create_access_token
from app.config import get_settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
settings = get_settings()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
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
    
    # Create new user
    user_id = str(uuid.uuid4())
    new_user = User(
        id=user_id,
        email=request.email,
        username=request.username or request.email.split('@')[0],
        password_hash=hash_password(request.password),
        first_name=request.first_name,
        last_name=request.last_name,
        status=UserStatus.ACTIVE,
        referral_code=str(uuid.uuid4())[:8].upper(),
        referred_by=request.referral_code
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Generate tokens
    access_token = create_access_token(data={"sub": new_user.id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=None,
        user_id=new_user.id,
        expires_in=settings.SESSION_TIMEOUT_MINUTES * 60
    )

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

@router.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    return {"message": "If an account exists with this email, a reset link has been sent"}
