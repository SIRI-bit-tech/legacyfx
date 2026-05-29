"""
Ably token authentication endpoint
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from ably import AblyRest
from pydantic import BaseModel
from app.config import get_settings
from app.models.user import User
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ably", tags=["ably"])

settings = get_settings()


class SymbolSubscriptionRequest(BaseModel):
    symbol: str
    action: str  # "subscribe" or "unsubscribe"


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
            # Price channels (public data)
            "prices:*": ["subscribe"],
            # Order book channels (public data)
            "orderbook:*": ["subscribe"],
            # User-specific order updates
            f"orders:{current_user.id}": ["subscribe"],
            # User-specific funds updates
            f"funds:{current_user.id}": ["subscribe"],
        }
        
        # Remove None values from capabilities
        capabilities = {k: v for k, v in capabilities.items() if v is not None}
        
        # Generate token request with proper token_params mapping
        # In modern ably-python, create_token_request is async and uses token_params
        token_params = {
            'capability': capabilities,
            'clientId': f"user-{current_user.id}",
            'ttl': 3600000  # 1 hour
        }
        
        token_request = await ably_rest.auth.create_token_request(token_params=token_params)
        
        # Manually construct response with capability as a string that MATCHES THE SIGNATURE
        return JSONResponse(content={
            "keyName": token_request.key_name,
            "clientId": token_request.client_id,
            "capability": str(token_request.capability), # Use library's internal stringification
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


@router.post("/subscribe-symbol")
async def subscribe_symbol(
    request: SymbolSubscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Notify backend that a user is subscribing/unsubscribing to a symbol.
    This helps the backend track which symbols need live data.
    """
    try:
        from app.services.price_broadcast import price_broadcast_service
        
        if request.action == "subscribe":
            price_broadcast_service.add_symbol(request.symbol)
            logger.info(f"User {current_user.id} subscribed to {request.symbol}")
        elif request.action == "unsubscribe":
            price_broadcast_service.remove_symbol(request.symbol)
            logger.info(f"User {current_user.id} unsubscribed from {request.symbol}")
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
        return {"status": "success", "symbol": request.symbol, "action": request.action}
        
    except Exception as e:
        logger.error(f"Error handling symbol subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to process subscription")


@router.post("/subscribe-orderbook")
async def subscribe_orderbook(
    request: SymbolSubscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Notify backend that a user is subscribing/unsubscribing to order book data.
    This helps the backend track which symbols need live order book updates.
    """
    try:
        from app.services.kucoin_orderbook import kucoin_orderbook_service
        from app.services.synthetic_orderbook import synthetic_orderbook_service
        from app.utils.symbolFormat import to_kucoin

        def normalize_symbol(sym: str) -> str:
            return sym.replace("-", "").replace("/", "").upper().strip()

        # These are the forex presets used by the frontend dropdown.
        forex_symbols = {"EURUSD", "GBPUSD", "USDJPY", "USDCHF", "USDCAD", "AUDUSD", "NZDUSD"}

        def is_crypto_symbol(sym: str) -> bool:
            s = normalize_symbol(sym)
            if s in forex_symbols:
                return False
            # Common crypto quote assets used by KuCoin format conversion.
            crypto_quotes = {"USDT", "USDC", "BTC", "ETH", "BNB", "USD"}
            return any(s.endswith(q) for q in crypto_quotes)
        
        normalized_symbol = normalize_symbol(request.symbol)
        
        if request.action == "subscribe":
            if is_crypto_symbol(normalized_symbol):
                # Convert symbol to KuCoin format (BTC-USDT)
                kucoin_symbol = to_kucoin(normalized_symbol)
                await kucoin_orderbook_service.subscribe_symbol(kucoin_symbol)
                logger.info(f"User {current_user.id} subscribed to order book for {kucoin_symbol}")
            else:
                await synthetic_orderbook_service.subscribe_symbol(normalized_symbol)
                logger.info(f"User {current_user.id} subscribed to synthetic order book for {normalized_symbol}")
        elif request.action == "unsubscribe":
            if is_crypto_symbol(normalized_symbol):
                kucoin_symbol = to_kucoin(normalized_symbol)
                await kucoin_orderbook_service.unsubscribe_symbol(kucoin_symbol)
                logger.info(f"User {current_user.id} unsubscribed from order book for {kucoin_symbol}")
            else:
                await synthetic_orderbook_service.unsubscribe_symbol(normalized_symbol)
                logger.info(f"User {current_user.id} unsubscribed from synthetic order book for {normalized_symbol}")
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
        # The client doesn't rely on this return value for the channel name.
        return {"status": "success", "symbol": normalized_symbol, "action": request.action}
        
    except Exception as e:
        logger.error(f"Error handling order book subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to process subscription")


