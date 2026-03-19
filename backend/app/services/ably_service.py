import logging
from ably import AblyRest
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class AblyService:
    def __init__(self):
        self.api_key = settings.ABLY_API_KEY or settings.ABLY_KEY
        self.client = None
        if self.api_key:
            try:
                self.client = AblyRest(self.api_key)
                logger.info("Ably localized client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Ably: {str(e)}")
        else:
            logger.warning("Ably API Key not found in settings. Real-time updates will be disabled.")

    async def broadcast(self, channel_name: str, event_name: str, data: dict):
        """Broadcast a message to an Ably channel."""
        if not self.client:
            logger.debug(f"Ably client not initialized. Skipping broadcast to {channel_name}")
            return False

        try:
            channel = self.client.channels.get(channel_name)
            # Await the publish call (required by newer Ably SDKs)
            await channel.publish(event_name, data)
            logger.debug(f"Broadcasted to {channel_name}: {event_name}")
            return True
        except Exception as e:
            logger.error(f"Error broadcasting to Ably channel {channel_name}: {str(e)}")
            return False

# Global instance
ably_service = AblyService()
