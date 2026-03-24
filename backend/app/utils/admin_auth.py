"""Admin authentication utilities."""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.admin import Admin, AdminStatus
from app.utils.auth import verify_token

oauth2_admin_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/admin/auth/login")


async def get_current_admin(
    token: str = Depends(oauth2_admin_scheme),
    db: AsyncSession = Depends(get_db)
) -> Admin:
    """Dependency for getting the currently authenticated admin."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = verify_token(token)
        if payload is None:
            raise credentials_exception

        if payload.get("type") != "admin":
            raise credentials_exception

        admin_id: str | None = payload.get("sub")
        if not admin_id:
            raise credentials_exception

        stmt = select(Admin).where(Admin.id == admin_id)
        result = await db.execute(stmt)
        admin = result.scalar_one_or_none()

        if not admin:
            raise credentials_exception

        if admin.status != AdminStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin account is disabled"
            )

        return admin
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate admin session: {str(exc)}"
        )
