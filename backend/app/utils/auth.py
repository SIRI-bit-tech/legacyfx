from datetime import datetime, timedelta
from typing import Optional
import pyotp
import qrcode
from io import BytesIO
import base64
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import get_settings
from app.database import get_db
# Note: Import User models locally within functions to avoid circular imports if needed, 
# but since models doesn't import utils.auth, we can import it here.
from app.models.user import User

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

import bcrypt

# Password hashing functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    # Generate salt and hash the password
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.SESSION_TIMEOUT_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        return None

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency for getting the currently authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
        
    if user.status == "SUSPENDED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is suspended"
        )
        
    return user


async def is_admin(user: User, db: AsyncSession) -> bool:
    """Check if a user has admin privileges.
    
    Checks if the user's email exists in the admins table with ACTIVE status.
    This is the authoritative source of truth for admin privileges.
    """
    from app.models.admin import Admin, AdminStatus
    
    # Normalize email for case-insensitive comparison
    normalized_email = user.email.strip().lower()
    
    stmt = select(Admin).where(
        Admin.email == normalized_email,
        Admin.status == AdminStatus.ACTIVE
    )
    result = await db.execute(stmt)
    admin = result.scalar_one_or_none()
    
    return admin is not None


def generate_totp_secret() -> str:
    """Generate a TOTP secret for 2FA."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer: str = "Legacy FX") -> str:
    """Get TOTP URI for QR code generation."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer)


def generate_qr_code(uri: str) -> str:
    """Generate QR code as base64 encoded image."""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def verify_totp(secret: str, token: str) -> bool:
    """Verify TOTP token."""
    totp = pyotp.TOTP(secret)
    return totp.verify(token)


def generate_backup_codes(count: int = 10) -> list[str]:
    """Generate backup codes for 2FA."""
    import secrets
    codes = []
    for _ in range(count):
        code = ''.join(format(x, '02x') for x in secrets.token_bytes(4))
        codes.append(code)
    return codes


def generate_otp() -> str:
    """Generate 6-digit OTP for email verification."""
    import random
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])
