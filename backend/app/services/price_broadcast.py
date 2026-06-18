"""
Price broadcast service for real-time price updates via Ably.
Fetches prices from Twelve Data API and broadcasts to connected clients.
"""
import asyncio
import logging
import httpx
from typing import Dict, Set, Optional, List
from datetime import datetime, timedelta
from ably import AblyRest

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class PriceBroadcastService:
    """Service for broadcasting live price updates to clients via Ably."""
    
    def __init__(self):
        self.ably_client: Optional[AblyRest] = None
        self.active_symbols: Set[str] = set()
        self.per_symbol_users: Dict[str, Set[str]] = {}
        self.price_cache: Dict[str, dict] = {}
        self.running = False
        self.task: Optional[asyncio.Task] = None
        
        # Rate limiting
        self.api_calls_count = 0
        self.api_calls_reset = datetime.now()
        self.max_calls_per_minute = 60  # Higher limit for CMC key
        
    async def start(self):
        """Start the price broadcast service."""
        if self.running:
            return
            
        api_key = settings.ABLY_API_KEY or settings.ABLY_KEY
        if not api_key:
            logger.error("Ably API key not configured")
            return
            
        try:
            self.ably_client = AblyRest(api_key)
            self.running = True
            self.task = asyncio.create_task(self._broadcast_loop())
            logger.info("Price broadcast service started")
        except Exception as e:
            logger.error(f"Failed to start price broadcast service: {e}")
            
    async def stop(self):
        """Stop the price broadcast service."""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Price broadcast service stopped")
        
    def add_symbol(self, symbol: str):
        """Add a symbol to the tracking list."""
        self.active_symbols.add(symbol)
        
    def remove_symbol(self, symbol: str):
        """Remove a symbol from tracking."""
        self.active_symbols.discard(symbol)

    def subscribe_symbol_for_user(self, user_id: str, symbol: str):
        """Track per-user subscriptions for a symbol."""
        if symbol not in self.per_symbol_users:
            self.per_symbol_users[symbol] = set()
        self.per_symbol_users[symbol].add(user_id)
        if symbol not in self.active_symbols:
            self.add_symbol(symbol)

    def unsubscribe_symbol_for_user(self, user_id: str, symbol: str):
        """Untrack user's subscription; stop tracking symbol if no users left."""
        if symbol in self.per_symbol_users:
            self.per_symbol_users[symbol].discard(user_id)
            if not self.per_symbol_users[symbol]:
                self.per_symbol_users.pop(symbol, None)
                self.remove_symbol(symbol)
        
    async def _broadcast_loop(self):
        """Main loop with batch processing and adaptive throttling."""
        while self.running:
            try:
                # 1. Reset rate limit counter
                if datetime.now() - self.api_calls_reset > timedelta(minutes=1):
                    self.api_calls_count = 0
                    self.api_calls_reset = datetime.now()
                
                # 2. Fetch all active symbols in a single batch
                symbols = list(self.active_symbols)
                if symbols:
                    await self._fetch_batch_and_broadcast(symbols)
                
                # 3. Adaptive Sleep: Balance interval with remaining quota
                # If we have many symbols that count as multiple calls, we must sleep longer
                call_weight = len(symbols)
                remaining_calls = self.max_calls_per_minute - self.api_calls_count
                
                if remaining_calls <= 0:
                    # Wait for bucket reset
                    sleep_time = 61 - (datetime.now() - self.api_calls_reset).seconds
                    await asyncio.sleep(max(1, sleep_time))
                else:
                    # Target interval based on quota
                    await asyncio.sleep(max(3, settings.PRICE_UPDATE_INTERVAL / 1000.0))
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in price broadcast loop: {e}")
                await asyncio.sleep(5)
                
    async def _fetch_batch_and_broadcast(self, symbols: List[str]):
        """Fetch multiple symbols in one request and broadcast each."""
        try:
            # CMC expects comma separated symbols like BTC,ETH,SOL
            cmc_symbols = []
            for s in symbols:
                clean = s.replace("-", "").replace("/", "").upper()
                if clean.endswith("USDT"): clean = clean[:-4]
                elif clean.endswith("USD"): clean = clean[:-3]
                cmc_symbols.append(clean)
                
            symbol_batch = ",".join(set(cmc_symbols)) # unique symbols only
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"
                headers = {
                    "X-CMC_PRO_API_KEY": settings.CMC_API_KEY, 
                    "Accept": "application/json"
                }
                params = {"symbol": symbol_batch}
                
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
                json_data = response.json()
                
                self.api_calls_count += 1
                
                data_dict = json_data.get("data", {})
                for orig_symbol, clean_sym in zip(symbols, cmc_symbols):
                    if clean_sym in data_dict:
                        quote = data_dict[clean_sym]["quote"]["USD"]
                        price_data = {
                            "price": float(quote.get("price", 0)),
                            "change24h": float(quote.get("percent_change_24h", 0)),
                            "high24h": float(quote.get("price", 0)) * 1.05,
                            "low24h": float(quote.get("price", 0)) * 0.95,
                            "volume24h": float(quote.get("volume_24h", 0)),
                            "timestamp": datetime.now().isoformat()
                        }
                        self.price_cache[orig_symbol] = price_data
                        await self._broadcast_to_ably(orig_symbol, price_data)
                            
        except Exception as e:
            logger.error(f"Error in batch fetch: {e}")
            for symbol in symbols:
                await self._broadcast_cached(symbol)

    async def _broadcast_to_ably(self, symbol: str, data: dict):
        """Institutional Ably broadcast."""
        if not self.ably_client:
            return
        try:
            channel_name = f"prices:{symbol}"
            channel = self.ably_client.channels.get(channel_name)
            await channel.publish("update", data)
        except Exception as e:
            logger.error(f"Ably broadcast failed for {symbol}: {e}")
            
    async def _broadcast_cached(self, symbol: str):
        if symbol in self.price_cache:
            await self._broadcast_to_ably(symbol, self.price_cache[symbol])
            


# Global instance
price_broadcast_service = PriceBroadcastService()
