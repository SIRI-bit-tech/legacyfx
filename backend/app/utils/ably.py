"""
Ably real-time messaging integration
"""
import logging
from ably import AblyRest
from app.config import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)

# Initialize Ably client
client = None


def init_ably():
    """Initialize Ably REST client"""
    global client
    try:
        client = AblyRest(settings.ABLY_KEY)
        logger.info("Ably client initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Ably: {e}")


async def publish_message(channel: str, event: str, data: dict) -> bool:
    """Publish a message to an Ably channel"""
    try:
        if not client:
            init_ably()
        
        channel_obj = client.channels.get(channel)
        channel_obj.publish(event, data)
        return True
    except Exception as e:
        logger.error(f"Error publishing to Ably: {e}")
        return False


async def publish_trade_update(user_id: str, trade_data: dict) -> bool:
    """Publish trade update to user's channel"""
    return await publish_message(f"user-{user_id}-trades", "trade.update", trade_data)


async def publish_balance_update(user_id: str, balance: float) -> bool:
    """Publish balance update to user's channel"""
    return await publish_message(f"user-{user_id}-balance", "balance.update", {"balance": balance})


async def publish_price_alert(user_id: str, symbol: str, price: float) -> bool:
    """Publish price alert to user's channel"""
    return await publish_message(
        f"user-{user_id}-alerts",
        "price.alert",
        {"symbol": symbol, "price": price}
    )


async def publish_signal(user_id: str, signal_data: dict) -> bool:
    """Publish trading signal to user's channel"""
    return await publish_message(f"user-{user_id}-signals", "signal.new", signal_data)
