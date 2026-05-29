from datetime import datetime
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.models.admin import Admin, AdminStatus
from app.utils.auth import hash_password, verify_password, create_access_token

settings = get_settings()


def normalize_email(email: str) -> str:
    return email.strip().lower()


async def get_admin_by_email(db: AsyncSession, email: str) -> Admin | None:
    stmt = select(Admin).where(Admin.email == email)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def register_admin_account(
    db: AsyncSession,
    name: str,
    email: str,
    password: str,
    admin_code: str
) -> dict:
    try:
        if admin_code != settings.ADMIN_REGISTRATION_CODE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid admin registration code"
            )

        normalized_email = normalize_email(email)
        existing = await get_admin_by_email(db, normalized_email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin with this email already exists"
            )

        new_admin = Admin(
            id=str(uuid.uuid4()),
            email=normalized_email,
            name=name.strip(),
            password_hash=hash_password(password),
            status=AdminStatus.ACTIVE,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(new_admin)
        await db.commit()

        return {"message": "Admin account created successfully. You can now log in."}
    except HTTPException:
        await db.rollback()
        raise
    except (SQLAlchemyError, OSError) as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed. Check DATABASE_URL and network access."
        ) from exc
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register admin: {str(exc)}"
        )


async def login_admin_account(db: AsyncSession, email: str, password: str) -> dict:
    try:
        normalized_email = normalize_email(email)
        admin = await get_admin_by_email(db, normalized_email)

        if not admin or not verify_password(password, admin.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if admin.status != AdminStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin account is disabled"
            )

        admin.last_login = datetime.utcnow()
        admin.updated_at = datetime.utcnow()
        await db.commit()

        access_token = create_access_token({"sub": admin.id, "type": "admin"})

        return {
            "access_token": access_token,
            "admin": {
                "id": admin.id,
                "email": admin.email,
                "name": admin.name,
                "status": admin.status.value if hasattr(admin.status, "value") else admin.status,
                "created_at": admin.created_at
            }
        }
    except HTTPException:
        await db.rollback()
        raise
    except (SQLAlchemyError, OSError) as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed. Check DATABASE_URL and network access."
        ) from exc
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to login admin: {str(exc)}"
        )
