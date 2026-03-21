"""
Ably token authentication endpoint
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from ably import AblyRest
from app.config import get_settings
from app.models.user import User
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

settings = get_settings()

@router.get("/token")
async def get_ably_token(current_user: User = Depends(get_current_user)):
    """
    Generate an Ably token request for authenticated users.
    
    This endpoint provides secure token-based authentication for Ably real-time messaging.
    Tokens are short-lived and have limited permissions based on user role.
    """
    try:
        # Check if Ably is configured
        if not settings.ABLY_KEY and not settings.ABLY_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="Real-time messaging service not configured"
            )
        
        # Use the available API key
        api_key = settings.ABLY_API_KEY or settings.ABLY_KEY
        
        # Initialize Ably REST client
        ably_rest = AblyRest(api_key)
        
        # Create token request with appropriate capabilities
        # For most users, we only allow subscribing to channels
        capabilities = {
            # User can subscribe to their own channels
            f"user:{current_user.id}:*": ["subscribe"],
            # User can subscribe to public channels
            "public:*": ["subscribe"],
            # Mining stats channel (public data)
            "mining-stats": ["subscribe"],
            # Copy trading updates (if user has copy trading enabled)
            "copy-trading": ["subscribe"] if current_user.copy_trading_enabled else None,
        }
        
        # Remove None values from capabilities
        capabilities = {k: v for k, v in capabilities.items() if v is not None}
        
        # Generate token request
        token_request = ably_rest.auth.create_token_request(
            capability=capabilities,
            client_id=f"user-{current_user.id}",  # Unique identifier for the client
            ttl=3600000,  # Token valid for 1 hour (in milliseconds)
        )
        
        return JSONResponse(content={
            "keyName": token_request.key_name,
            "clientId": token_request.client_id,
            "capability": token_request.capability,
            "timestamp": token_request.timestamp,
            "nonce": token_request.nonce,
            "mac": token_request.mac,
            "ttl": token_request.ttl
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating Ably token: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate authentication token"
        )
