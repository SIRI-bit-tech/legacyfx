"""Tier-based authorization middleware for enforcing feature access."""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Union

from app.database import get_db
from app.models.user import User, UserTier
from app.utils.auth import get_current_user

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def require_tier(required_tiers: Union[List[str], str]):
    """
    Create a dependency that requires the user to have one of the specified tiers.
    
    Args:
        required_tiers: List of allowed tier names or single tier name
        
    Returns:
        Dependency function that checks user tier and raises 403 if not authorized
    """
    if isinstance(required_tiers, str):
        required_tiers = [required_tiers]
    
    async def tier_dependency(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        """Check if user has required tier for feature access."""
        user_tier = current_user.tier.value if current_user.tier else "BASIC"
        
        if user_tier not in required_tiers:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. This feature requires one of these tiers: {', '.join(required_tiers)}. Your current tier: {user_tier}."
            )
        
        return current_user
    
    return tier_dependency

# Predefined tier dependencies for common use cases
require_pro_or_higher = require_tier(['PRO', 'ELITE', 'LEGACY_MASTER'])
require_elite_or_higher = require_tier(['ELITE', 'LEGACY_MASTER'])
require_legacy_master = require_tier(['LEGACY_MASTER'])
