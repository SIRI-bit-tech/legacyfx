"""
Better Auth token validation
"""
import jwt
import logging
from app.config import settings

logger = logging.getLogger(__name__)


def validate_better_auth_token(token: str) -> dict | None:
    """Validate Better Auth session token"""
    try:
        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )
        return payload
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {e}")
        return None
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        return None


def extract_user_id_from_token(token: str) -> str | None:
    """Extract user ID from Better Auth token"""
    payload = validate_better_auth_token(token)
    if payload:
        return payload.get("sub") or payload.get("user_id")
    return None
