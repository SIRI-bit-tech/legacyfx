"""
Admin authentication utilities
"""
import logging
from database import SessionLocal
from models.user import User

logger = logging.getLogger(__name__)


async def is_admin(user_id: str) -> bool:
    """Check if user is admin"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        return user and user.role == "admin" if hasattr(user, 'role') else False
    except Exception as e:
        logger.error(f"Admin check error: {e}")
        return False
    finally:
        db.close()


async def is_support_agent(user_id: str) -> bool:
    """Check if user is support agent"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        return user and user.role in ["admin", "support"] if hasattr(user, 'role') else False
    except Exception as e:
        logger.error(f"Support agent check error: {e}")
        return False
    finally:
        db.close()
